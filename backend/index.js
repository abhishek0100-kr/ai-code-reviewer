require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { GoogleGenAI } = require('@google/genai');
const prisma = require('./db');
const { reviewResponseSchema } = require('./schema');
const authRouter = require('./auth');
const { authenticateToken } = require('./middleware');
const logger = require('./logger');

const app = express();
const port = process.env.PORT || 5000;

const baseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests from this node. Please try again after 15 minutes.' }
});

const aiAnalysisLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'AI diagnostic threshold reached. Please limit code reviews to 5 per minute.' }
});

app.use(baseLimiter);

app.use(cors({
  origin: ['http://localhost:3000', 'https://ai-code-reviewer-frontend-pink.vercel.app']
}));

app.use(express.json({ limit: '500kb' }));

app.use((req, res, next) => {
  logger.info(`HTTP ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRouter);

app.get('/api/review/history', authenticateToken, async (req, res) => {
  if (!req.user || !req.user.userId) {
    return res.status(401).json({ error: 'Authentication token required to view history.' });
  }

  try {
    const historicalAudits = await prisma.audit.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });

    return res.status(200).json(historicalAudits);
  } catch (error) {
    logger.error("History retrieval pipeline fault", error);
    return res.status(500).json({ error: 'Failed to retrieve structural audit history.' });
  }
});

app.post('/api/review', aiAnalysisLimiter, authenticateToken, async (req, res) => {
  const { code, language } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: "Missing or invalid parameter 'code'." });
  }

  const selectedLanguage = language || 'Unknown';
  const activeUserId = req.user ? req.user.userId : null;

  try {
    logger.info(`Initiating Gemini AI audit for language vector: ${selectedLanguage}`);
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = 
      `You are an expert full-stack static analyzer. Review the user's provided code snippet written in ${selectedLanguage}. ` +
      "Identify computational complexity, performance anti-patterns, security risks, and readability concerns. " +
      "Support multiple programming language formats including JavaScript, Python, Java, C++, C, Go, Rust, and TypeScript. " +
      "Ensure the 'type' attribute for each issue object strictly equals 'Security', 'Optimization', or 'Readability'. " +
      "If no flaws are discovered, return an empty array for the issues property.";
      
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      contents: code,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: reviewResponseSchema,
        temperature: 0.2
      }
    });

    if (!response || !response.text) {
      throw new Error("Empty execution return string from external inference model engine.");
    }

    const parsedData = JSON.parse(response.text);

    await prisma.audit.create({
      data: {
        userId: activeUserId,
        language: selectedLanguage,
        sourceCode: code,
        timeComplexity: parsedData.complexity?.time || 'N/A',
        spaceComplexity: parsedData.complexity?.space || 'N/A',
        explanation: parsedData.complexity?.explanation || '',
        issuesCount: Array.isArray(parsedData.issues) ? parsedData.issues.length : 0,
        issuesJson: JSON.stringify(parsedData.issues || [])
      }
    });

    logger.info(`Audit successfully stored in Supabase for user correlation ID: ${activeUserId}`);
    return res.status(200).json(parsedData);

  } catch (error) {
    logger.error("Internal Engine Fault Logged", error);
    return res.status(502).json({
      error: "Analysis failure",
      message: error.message 
    });
  }
});

app.post('/api/review/repository', aiAnalysisLimiter, authenticateToken, async (req, res) => {
  const { repoUrl } = req.body;
  const activeUserId = req.user ? req.user.userId : null;

  if (!repoUrl || typeof repoUrl !== 'string') {
    return res.status(400).json({ error: "Missing or invalid parameter 'repoUrl'." });
  }

  try {
    logger.info(`Initiating macro repository ingestion stream for URL: ${repoUrl}`);
    const { Octokit } = require('@octokit/rest');
    const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const TARGET_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.prisma'];
    const BLACKLIST_PATHS = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'node_modules/', '.next/', 'dist/', 'build/', 'coverage/', '.git/', 'public/'];

    const regex = /github\.com\/([^/]+)\/([^/]+)/;
    const matches = repoUrl.match(regex);
    if (!matches) {
      return res.status(400).json({ error: "Invalid GitHub Repository URL link format parsed." });
    }

    const owner = matches[1];
    const repo = matches[2].replace(/\.git$/, '');

    const repoMeta = await octokit.repos.get({ owner, repo });
    const defaultBranch = repoMeta.data.default_branch;

    const treeResponse = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: defaultBranch,
      recursive: true
    });

    const allFiles = treeResponse.data.tree.filter(node => node.type === 'blob');
    let structuralContextMap = '';
    let processedCount = 0;

    for (const file of allFiles) {
      const filePath = file.path;
      const matchesExtension = TARGET_EXTENSIONS.some(ext => filePath.endsWith(ext));
      const hitsBlacklist = BLACKLIST_PATHS.some(blackPath => filePath.includes(blackPath));

      if (matchesExtension && !hitsBlacklist) {
        processedCount++;
        try {
          const fileContentRes = await octokit.repos.getContent({
            owner,
            repo,
            path: filePath,
            ref: defaultBranch
          });

          if (fileContentRes.data && fileContentRes.data.content) {
            const rawTextCode = Buffer.from(fileContentRes.data.content, 'base64').toString('utf-8');
            structuralContextMap += `\n==================\nFILE: ${filePath}\n==================\n${rawTextCode}\n`;
          }
        } catch (fErr) {
          logger.error(`Failed loading repository file path: ${filePath} - ${fErr.message}`);
        }
      }
    }

    if (processedCount === 0) {
      return res.status(422).json({ error: "No matching language files identified inside the targeted repository." });
    }

    const repoReviewSchema = {
      type: "OBJECT",
      properties: {
        summary: {
          type: "OBJECT",
          properties: {
            overallScore: { type: "INTEGER" },
            securityScore: { type: "INTEGER" },
            architectureScore: { type: "INTEGER" },
            readabilityScore: { type: "INTEGER" },
            maintainabilityScore: { type: "INTEGER" },
            architecturalOverview: { type: "STRING" }
          },
          required: ["overallScore", "securityScore", "architectureScore", "readabilityScore", "maintainabilityScore", "architecturalOverview"]
        },
        issues: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              filePath: { type: "STRING" },
              type: { type: "STRING" },
              line: { type: "INTEGER" },
              description: { type: "STRING" },
              snippet: { type: "STRING" }
            },
            required: ["filePath", "type", "line", "description", "snippet"]
          }
        }
      },
      required: ["summary", "issues"]
    };

    const systemInstruction = 
      "You are an expert full-stack Software Architect and Technical System Design Auditor. " +
      "You are reviewing an entire multi-file project repository codebase context map. " +
      "Analyze macro-architecture modularity, overall security layout across files, directory design choices, and file communication dependencies. " +
      "Calculate individual numerical portfolio analysis grades out of 100 for securityScore, architectureScore, readabilityScore, and maintainabilityScore. " +
      "overallScore must represent a fair weighted mathematical average of those components. " +
      "Ensure that the 'type' attribute for every issue object strictly equals 'Security', 'Optimization', or 'Readability'. " +
      "Provide the explicit path name inside 'filePath' for every single violation flag logged.";

    logger.info(`Dispatching ${processedCount} bundled repository source files to Gemini API...`);

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: structuralContextMap,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: repoReviewSchema,
        temperature: 0.2
      }
    });

    if (!aiResponse || !aiResponse.text) {
      throw new Error("Empty execution return string from external inference model engine.");
    }

    const parsedData = JSON.parse(aiResponse.text);

    // Hardened defensive storage block to safeguard the network request against foreign key tracking bugs
    let savedAudit = null;
    try {
      savedAudit = await prisma.audit.create({
        data: {
          userId: activeUserId,
          language: 'repository',
          sourceCode: repoUrl,
          timeComplexity: `Score: ${parsedData.summary.overallScore}/100`,
          spaceComplexity: `S:${parsedData.summary.securityScore} | A:${parsedData.summary.architectureScore} | R:${parsedData.summary.readabilityScore} | M:${parsedData.summary.maintainabilityScore}`,
          explanation: parsedData.summary.architecturalOverview,
          issuesCount: parsedData.issues.length,
          issuesJson: JSON.stringify(parsedData.issues)
        }
      });
      logger.info(`Repository audit logged successfully in Supabase for user correlation ID: ${activeUserId}`);
    } catch (dbError) {
      logger.error(`Defensive Guard Triggered - Storing audit log rows skipped due to parent user mismatch trace: ${dbError.message}`);
    }
    
    return res.status(200).json({
      id: savedAudit ? savedAudit.id : `fallback-${Date.now()}`,
      language: 'repository',
      complexity: {
        time: `Score: ${parsedData.summary.overallScore}/100`,
        space: `S:${parsedData.summary.securityScore} | A:${parsedData.summary.architectureScore} | R:${parsedData.summary.readabilityScore} | M:${parsedData.summary.maintainabilityScore}`,
        explanation: parsedData.summary.architecturalOverview
      },
      issues: parsedData.issues
    });

  } catch (error) {
    logger.error("Internal Repository Analyzer Engine Fault Logged", error);
    return res.status(502).json({
      error: "Repository analysis failure",
      message: error.message
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: "Backend server is online and running!" });
});

app.listen(port, () => {
  logger.info("Server is successfully running on port " + port);
});
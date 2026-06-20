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
    return res.status(400).json({ error: "Missing or invalid payload parameter 'code'." });
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

app.get('/api/health', (req, res) => {
  res.json({ status: "Backend server is online and running!" });
});

app.listen(port, () => {
  logger.info(`Server is successfully running on port ${port}`);
});
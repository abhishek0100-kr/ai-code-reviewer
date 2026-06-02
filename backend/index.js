require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const { reviewResponseSchema } = require('./schema');

const app = express();
const port = 5000;

app.use(cors({
  origin: ['http://localhost:3000', 'https://ai-code-reviewer-frontend-pink.vercel.app']
}));
app.use(express.json());

app.post('/api/review', async (req, res) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: "Missing or invalid payload parameter 'code'." });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = 
      "You are an expert full-stack static analyzer. Review the user's provided code snippet. " +
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
    return res.status(200).json(parsedData);

  } catch (error) {
    console.error("Internal Engine Fault Logged:", error.message);
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
  console.log(`Server is successfully running on port ${port}`);
});
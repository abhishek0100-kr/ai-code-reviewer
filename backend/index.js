require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const port = 5000;

// Initialize the Gemini client using our secured environment key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(cors());
app.use(express.json());

// Strict JSON Schema Definition for Model Compliance
const reviewResponseSchema = {
  type: "OBJECT",
  properties: {
    complexity: {
      type: "OBJECT",
      properties: {
        time: { type: "STRING" },
        space: { type: "STRING" },
        explanation: { type: "STRING" }
      },
      required: ["time", "space", "explanation"]
    },
    issues: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          type: { type: "STRING" },
          line: { type: "INTEGER" },
          description: { type: "STRING" },
          snippet: { type: "STRING" }
        },
        required: ["type", "line", "description", "snippet"]
      }
    }
  },
  required: ["complexity", "issues"]
};

// Remove the global "const ai = ..." line from the top of the file entirely!

app.post('/api/review', async (req, res) => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: "Missing or invalid payload parameter 'code'." });
  }

  try {
    // Initialize the client directly inside the route to guarantee env availability
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const systemInstruction = 
      "You are an expert static analyzer. Review the user's JavaScript code snippet. " +
      "Identify computational complexity, performance anti-patterns, security risks, and readability concerns. " +
      "Ensure the 'type' attribute for each issue object strictly equals 'Security', 'Optimization', or 'Readability'. " +
      "If no flaws are discovered, return an empty array for the issues property.";

    // Use gemini-2.5-flash for ultimate global cloud stability
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
    
    // Pass error.message directly so our network tab shows us the absolute truth
    return res.status(502).json({
      error: "Analysis failure",
      message: error.message 
    });
  }
});

// Simple Health Route
app.get('/api/health', (req, res) => {
  res.json({ status: "Backend server is online and running!" });
});

app.listen(port, () => {
  console.log(`Server is successfully running on port ${port}`);
});
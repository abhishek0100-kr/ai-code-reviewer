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

// Phase 7A Refactoring Structured Output Schema
const refactorResponseSchema = {
  type: "OBJECT",
  properties: {
    explanation: { type: "STRING" },
    refactoredCode: { type: "STRING" }
  },
  required: ["explanation", "refactoredCode"]
};

module.exports = { reviewResponseSchema, refactorResponseSchema };

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const EMBEDDING_MODEL =
  process.env.EMBEDDING_MODEL || "gemini-embedding-001";

export const EMBEDDING_DIMENSIONS = Number(
  process.env.EMBEDDING_DIMENSIONS || 1536
);

export const generateEmbeddings = async (
  texts,
  taskType = "RETRIEVAL_DOCUMENT"
) => {
  if (!Array.isArray(texts) || texts.length === 0) {
    throw new Error("Please provide text to generate embeddings");
  }

  const allowedTaskTypes = [
    "RETRIEVAL_DOCUMENT",
    "RETRIEVAL_QUERY",
  ];

  if (!allowedTaskTypes.includes(taskType)) {
    throw new Error("Invalid embedding task type");
  }

  const cleanTexts = texts.map((text) => {
    if (typeof text !== "string" || !text.trim()) {
      throw new Error("Every input must be a non-empty string");
    }

    return text.trim();
  });

  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: cleanTexts,
    config: {
      taskType,
      outputDimensionality: EMBEDDING_DIMENSIONS,
    },
  });

  if (
    !response.embeddings ||
    response.embeddings.length !== cleanTexts.length
  ) {
    throw new Error("Embedding response count does not match input count");
  }

  return response.embeddings.map((item) => {
    if (
      !item.values ||
      item.values.length !== EMBEDDING_DIMENSIONS
    ) {
      throw new Error("Unexpected embedding dimensions");
    }

    return item.values;
  });
};

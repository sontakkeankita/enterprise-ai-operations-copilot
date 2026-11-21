
import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is missing from server/.env");
}

export const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export const GEMINI_CHAT_MODEL =
  process.env.GEMINI_CHAT_MODEL || "gemini-3.5-flash-lite";

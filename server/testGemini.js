
console.log("TEST SCRIPT STARTED");

import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

console.log("Environment variables loaded");

console.log(
  "Gemini API key present:",
  Boolean(process.env.GEMINI_API_KEY)
);

console.log(
  "Gemini model:",
  process.env.GEMINI_CHAT_MODEL
);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function testGemini() {
  console.log("Sending request to Gemini...");

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_CHAT_MODEL,
      contents: "Reply with: Gemini is working.",
    });

    console.log("SUCCESS!");
    console.log("Response:", response.text);
  } catch (error) {
    console.error("GEMINI TEST FAILED:");
    console.error(error);
  }
}

testGemini().catch(console.error);

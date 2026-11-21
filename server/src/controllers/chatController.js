
import {
  answerWithRag,
} from "../services/rag/ragAnswerService.js";

export const askCopilot = async (req, res) => {
  try {
    const { question, limit = 5 } = req.body;

    // Validate the question.
    if (
      typeof question !== "string" ||
      !question.trim()
    ) {
      return res.status(400).json({
        message: "Please provide a valid question",
      });
    }

    if (question.trim().length > 2000) {
      return res.status(400).json({
        message: "Question cannot exceed 2000 characters",
      });
    }

    // Validate retrieval limit.
    const resultLimit = Number(limit);

    if (
      !Number.isInteger(resultLimit) ||
      resultLimit < 1 ||
      resultLimit > 10
    ) {
      return res.status(400).json({
        message: "Limit must be between 1 and 10",
      });
    }

    // Generate a RAG-based answer.
    const result = await answerWithRag({
      question: question.trim(),
      user: req.user,
      limit: resultLimit,
    });

    return res.status(200).json({
      message: "Copilot response generated successfully",
      question: question.trim(),
      ...result,
    });
  } catch (error) {
    console.error(
      "Copilot answer generation error:",
      error.message
    );

    return res.status(502).json({
      message: "Unable to generate an AI response right now",
    });
  }
};

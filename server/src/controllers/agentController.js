
import {
  runAgent,
} from "../services/agents/agentOrchestrator.js";

export const runAgentController = async (req, res) => {
  try {
    const { question } = req.body;

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

    const result = await runAgent({
      question: question.trim(),
      user: req.user,
    });

    return res.status(200).json({
      message: "Agent request processed successfully",
      question: question.trim(),
      ...result,
    });

  } catch (error) {
    console.error(
      "Agent execution error:",
      error.message
    );

    return res.status(500).json({
      message: "Unable to process the agent request",
    });
  }
};

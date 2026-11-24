
import Evaluation from "../models/Evaluation.js";

import {
  runRetrievalEvaluation,
  runAnswerEvaluation,
  runAgentEvaluation,
} from "../services/evaluation/evaluationService.js";

export const createRetrievalEvaluation = async (
  req,
  res,
  next
) => {
  try {
    const {
      testCaseId,
      question,
      retrievedIds,
      relevantIds,
    } = req.body;

    if (
      !Array.isArray(retrievedIds) ||
      !Array.isArray(relevantIds) ||
      !testCaseId
    ) {
      return res.status(400).json({
        message: "Invalid retrieval evaluation data",
      });
    }

    const evaluation =
      await runRetrievalEvaluation({
        testCaseId,
        question,
        retrievedIds,
        relevantIds,
        createdBy: req.user._id,
      });

    res.status(201).json({
      message: "Retrieval evaluation saved",
      evaluation,
    });
  } catch (error) {
    next(error);
  }
};

export const createAnswerEvaluation = async (
  req,
  res,
  next
) => {
  try {
    const {
      testCaseId,
      question,
      answer,
      expectedKeywords,
      validSourceIds,
      durationMs,
      model,
      tokenUsage,
    } = req.body;

    if (
      !testCaseId ||
      typeof answer !== "string" ||
      !Array.isArray(expectedKeywords) ||
      !Array.isArray(validSourceIds)
    ) {
      return res.status(400).json({
        message: "Invalid answer evaluation data",
      });
    }

    const evaluation =
      await runAnswerEvaluation({
        testCaseId,
        question,
        answer,
        expectedKeywords,
        validSourceIds,
        durationMs,
        model,
        tokenUsage,
        createdBy: req.user._id,
      });

    res.status(201).json({
      message: "Answer evaluation saved",
      evaluation,
    });
  } catch (error) {
    next(error);
  }
};

export const createAgentEvaluation = async (
  req,
  res,
  next
) => {
  try {
    const {
      testCaseId,
      question,
      expectedIntent,
      actualIntent,
      expectedTool,
      actualTool,
      toolExecuted,
      toolSucceeded,
      durationMs,
    } = req.body;

    if (
      !testCaseId ||
      typeof expectedIntent !== "string" ||
      typeof actualIntent !== "string" ||
      typeof toolExecuted !== "boolean" ||
      typeof toolSucceeded !== "boolean"
    ) {
      return res.status(400).json({
        message: "Invalid agent evaluation data",
      });
    }

    const evaluation =
      await runAgentEvaluation({
        testCaseId,
        question,
        expectedIntent,
        actualIntent,
        expectedTool: expectedTool ?? null,
        actualTool: actualTool ?? null,
        toolExecuted,
        toolSucceeded,
        durationMs,
        createdBy: req.user._id,
      });

    res.status(201).json({
      message: "Agent evaluation saved",
      evaluation,
    });
  } catch (error) {
    next(error);
  }
};

export const getEvaluations = async (
  req,
  res,
  next
) => {
  try {
    const {
      type,
      page = 1,
      limit = 20,
    } = req.query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      !Number.isInteger(limitNumber) ||
      limitNumber < 1 ||
      limitNumber > 100
    ) {
      return res.status(400).json({
        message: "Invalid pagination values",
      });
    }

    const filter = {};

    if (type) {
      filter.evaluationType = type;
    }

    const [evaluations, total] = await Promise.all([
      Evaluation.find(filter)
        .sort({ createdAt: -1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .populate("createdBy", "name email")
        .lean(),

      Evaluation.countDocuments(filter),
    ]);

    res.json({
      evaluations,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEvaluationSummary = async (
  req,
  res,
  next
) => {
  try {
    const summary = await Evaluation.aggregate([
      {
        $group: {
          _id: "$evaluationType",
          total: { $sum: 1 },
          passed: {
            $sum: {
              $cond: ["$passed", 1, 0],
            },
          },
          failed: {
            $sum: {
              $cond: ["$passed", 0, 1],
            },
          },
          averageDurationMs: {
            $avg: "$durationMs",
          },
        },
      },
    ]);

    res.json({
      summary,
    });
  } catch (error) {
    next(error);
  }
};

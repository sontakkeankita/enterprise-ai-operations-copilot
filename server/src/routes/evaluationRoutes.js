
import express from "express";

import {
  createRetrievalEvaluation,
  createAnswerEvaluation,
  createAgentEvaluation,
  getEvaluations,
  getEvaluationSummary,
} from "../controllers/evaluationController.js";

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);
router.use(authorizeRoles("admin"));

router.post(
  "/rag/retrieval",
  createRetrievalEvaluation
);

router.post(
  "/rag/answer",
  createAnswerEvaluation
);

router.post(
  "/agent",
  createAgentEvaluation
);

router.get(
  "/summary",
  getEvaluationSummary
);

router.get(
  "/",
  getEvaluations
);

export default router;

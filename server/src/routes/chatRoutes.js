
import express from "express";

import {
  protect,
} from "../middleware/authMiddleware.js";

import {
  askCopilot,
} from "../controllers/chatController.js";

const router = express.Router();

// All chat endpoints require authentication.
router.use(protect);

// Ask a question using RAG.
router.post("/ask", askCopilot);

export default router;


import express from "express";

import {
  protect,
} from "../middleware/authMiddleware.js";

import {
  runAgentController,
} from "../controllers/agentController.js";

const router = express.Router();

router.use(protect);

router.post("/run", runAgentController);

export default router;

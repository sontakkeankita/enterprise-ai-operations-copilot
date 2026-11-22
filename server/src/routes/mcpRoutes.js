import express from "express";

import {
  protect,
} from "../middleware/authMiddleware.js";

import {
  getMcpCapabilities,
} from "../controllers/mcpController.js";

const router = express.Router();

router.use(protect);

router.get(
  "/capabilities",
  getMcpCapabilities
);

export default router;

import express from "express";

import {
  getAllUsers
} from "../controllers/userController.js";

import {
  protect,
  authorizeRoles
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Only admin can view all users
router.get(
  "/",
  protect,
  authorizeRoles("admin"),
  getAllUsers
);

export default router;

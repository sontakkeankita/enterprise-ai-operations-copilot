
import express from "express";
import rateLimit from "express-rate-limit";

import {
  register,
  login,
  logout,
  getMe
} from "../controllers/authController.js";

import {
  protect
} from "../middleware/authMiddleware.js";

import validate from "../middleware/validateMiddleware.js";

import {
  registerSchema,
  loginSchema
} from "../validators/authValidators.js";

const router = express.Router();

// Limit repeated login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many login attempts. Try again later."
  }
});

// Registration
router.post(
  "/register",
  validate(registerSchema),
  register
);

// Login
router.post(
  "/login",
  loginLimiter,
  validate(loginSchema),
  login
);

// Logout
router.post(
  "/logout",
  logout
);

// Current logged-in user
router.get(
  "/me",
  protect,
  getMe
);

export default router;

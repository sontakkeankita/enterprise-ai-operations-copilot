
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// Parse cookies
app.use(cookieParser());

// Existing health API
app.use("/api", healthRoutes);

// Authentication APIs
app.use("/api/auth", authRoutes);

// User APIs
app.use("/api/users", userRoutes);

// Default route
app.get("/", (req, res) => {

  res.send("Enterprise AI Copilot API is working!");

});

// Not found handler
app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: "API route not found"
  });

});

export default app;

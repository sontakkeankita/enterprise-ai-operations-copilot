
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import agentRoutes from "./routes/agentRoutes.js";
import mcpRoutes from "./routes/mcpRoutes.js";
import approvalRoutes from "./routes/approvalRoutes.js";

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
app.use("/api/documents", documentRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/mcp", mcpRoutes);
app.use("/api/approvals", approvalRoutes);
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

app.use((err, req, res, next) => {
  console.error("API error:", err.message);

  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "File size cannot exceed 10 MB",
      });
    }

    return res.status(400).json({
      message: err.message,
    });
  }

  if (
    err.message === "Only PDF and TXT files are allowed"
  ) {
    return res.status(400).json({
      message: err.message,
    });
  }

  return res.status(500).json({
    message: "Something went wrong on the server",
  });
});

export default app;

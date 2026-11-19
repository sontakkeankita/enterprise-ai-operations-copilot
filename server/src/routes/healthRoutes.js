
import express from "express";
import mongoose from "mongoose";

const router = express.Router();

router.get("/health", (req, res) => {

  const databaseStatus =
    mongoose.connection.readyState === 1
      ? "connected"
      : "disconnected";

  res.status(200).json({
    success: true,
    message: "Enterprise AI Copilot backend is running",
    database: databaseStatus,
    timestamp: new Date().toISOString()
  });

});

export default router;

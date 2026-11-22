import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(
  fileURLToPath(import.meta.url)
);

// Reuse the existing backend environment file.
dotenv.config({
  path: path.resolve(
    currentDir,
    "../../server/.env"
  ),
});

export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing");
  }

  await mongoose.connect(process.env.MONGO_URI);

  console.error("MCP server connected to MongoDB");

  return mongoose.connection;
};
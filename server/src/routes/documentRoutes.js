
import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import {
  uploadDocumentFile,
} from "../middleware/uploadMiddleware.js";

import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
} from "../controllers/documentController.js";

const router = express.Router();

// All document APIs require login.
router.use(protect);

// Upload PDF or TXT.
router.post(
  "/upload",
  uploadDocumentFile,
  uploadDocument
);

// List accessible documents.
router.get("/", getDocuments);

// Get one document and its chunks.
router.get("/:id", getDocumentById);

// Delete document and chunks.
router.delete("/:id", deleteDocument);

export default router;

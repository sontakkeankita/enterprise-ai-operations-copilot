
import express from "express";

import { protect } from "../middleware/authMiddleware.js";

import {
  uploadDocumentFile,
} from "../middleware/uploadMiddleware.js";

import {
  semanticSearch,
  keywordSearch,
  hybridSemanticSearch,
} from "../controllers/searchController.js";
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
 generateDocumentEmbeddings,
} from "../controllers/documentController.js";

const router = express.Router();

// All document APIs require login.
router.use(protect);
router.post("/search/keyword", keywordSearch);

router.post("/search/hybrid", hybridSemanticSearch);

// Upload PDF or TXT.
router.post(
  "/upload",
  uploadDocumentFile,
  uploadDocument
);
router.post("/search", semanticSearch);

// List accessible documents.
router.get("/", getDocuments);
router.post("/:id/embed", generateDocumentEmbeddings);
// Get one document and its chunks.
router.get("/:id", getDocumentById);

// Delete document and chunks.
router.delete("/:id", deleteDocument);

export default router;

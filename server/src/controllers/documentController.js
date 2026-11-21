
import path from "node:path";

import Document from "../models/Document.js";
import DocumentChunk from "../models/DocumentChunk.js";

import { extractText } from "../services/documents/textExtractor.js";
import { splitIntoChunks } from "../services/documents/chunkingService.js";
import { embedDocumentChunks } from "../services/embeddings/documentEmbeddingService.js";

// Decide which documents a user is allowed to see.
const getAccessFilter = (user) => {
  if (user.role === "admin") {
    return {};
  }

  const conditions = [
    { uploadedBy: user._id },
  ];

  if (user.department) {
    conditions.push({
      department: user.department,
    });
  }

  return { $or: conditions };
};

// Upload a document.
export const uploadDocument = async (req, res) => {
  let document = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: "Please select a PDF or TXT file",
      });
    }

    const file = req.file;
    const extension = path.extname(file.originalname).toLowerCase();

    // Verify the actual PDF file signature.
    if (extension === ".pdf") {
      const signature = file.buffer
        .subarray(0, 5)
        .toString("ascii");

      if (signature !== "%PDF-") {
        return res.status(400).json({
          message: "The uploaded file is not a valid PDF",
        });
      }
    }

    // Reject binary-looking content in a TXT file.
    if (extension === ".txt" && file.buffer.includes(0)) {
      return res.status(400).json({
        message: "The TXT file contains invalid binary data",
      });
    }

    const originalName = path
      .basename(file.originalname)
      .replace(/[^\w.\- ()]/g, "_");

    // Extract text from the uploaded file.
    const extractedText = await extractText({
      ...file,
      originalname: originalName,
    });

    if (!extractedText) {
      return res.status(400).json({
        message: "No readable text was found in this document",
      });
    }

    // Split extracted text into chunks.
    const chunks = splitIntoChunks(extractedText);

    if (chunks.length === 0) {
      return res.status(400).json({
        message: "Could not create text chunks",
      });
    }

    // Use the department from the logged-in user.
    // Do not trust a department sent by the browser.
    const department = req.user.department || "Unassigned";

    // Save document metadata first.
    document = await Document.create({
      originalName,
      mimeType: file.mimetype,
      fileSize: file.size,
      department,
      uploadedBy: req.user._id,
      status: "processing",
      chunkCount: 0,
      extractedTextLength: extractedText.length,
    });

    // Prepare all chunk records.
    const chunkRecords = chunks.map((content, index) => ({
      documentId: document._id,
      content,
      chunkIndex: index,
      metadata: {
        source: originalName,
        department,
        uploadedBy: req.user._id,
      },
    }));

    // Save chunks in MongoDB.
    await DocumentChunk.insertMany(chunkRecords);
    const embeddingResult = await embedDocumentChunks(document._id);
    
    // Mark processing as complete.
    document.status = "completed";
    document.chunkCount = chunks.length;

    await document.save();

   return res.status(201).json({
  message: "Document uploaded and processed successfully",
  document: {
    id: document._id,
    originalName: document.originalName,
    department: document.department,
    status: "completed",
    chunkCount: chunks.length,
    extractedTextLength: document.extractedTextLength,

    embeddingStatus: "completed",
    embeddedChunkCount: embeddingResult.embeddedChunkCount,
    embeddingModel: embeddingResult.embeddingModel,
  },
});
  } catch (error) {
    console.error("Document upload error:", error);

    // Avoid leaving partially saved chunks behind.
    if (document) {
      await DocumentChunk.deleteMany({
        documentId: document._id,
      });

      document.status = "failed";
      await document.save();
    }

    return res.status(500).json({
      message: "Document processing failed",
    });
  }
};

// Get documents visible to the logged-in user.
export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find(
      getAccessFilter(req.user)
    )
      .select("-__v")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error("Get documents error:", error);

    return res.status(500).json({
      message: "Could not retrieve documents",
    });
  }
};

// Get one document and its chunks.
export const getDocumentById = async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      ...getAccessFilter(req.user),
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    const chunks = await DocumentChunk.find({
      documentId: document._id,
    })
      .sort({ chunkIndex: 1 })
      .select("content chunkIndex metadata");

    return res.status(200).json({
      document,
      chunks,
    });
  } catch (error) {
    console.error("Get document error:", error);

    return res.status(500).json({
      message: "Could not retrieve document",
    });
  }
};

// Delete a document. Only its uploader or an admin can delete it.
export const deleteDocument = async (req, res) => {
  try {
    const filter = { _id: req.params.id };

    if (req.user.role !== "admin") {
      filter.uploadedBy = req.user._id;
    }

    const document = await Document.findOne(filter);

    if (!document) {
      return res.status(404).json({
        message: "Document not found or you cannot delete it",
      });
    }

    await DocumentChunk.deleteMany({
      documentId: document._id,
    });

    await document.deleteOne();

    return res.status(200).json({
      message: "Document and its chunks deleted successfully",
    });
  } catch (error) {
    console.error("Delete document error:", error);

    return res.status(500).json({
      message: "Could not delete document",
    });
  }
};

export const generateDocumentEmbeddings = async (req, res) => {
  try {
    // Verify that this document is accessible to the user.
    const document = await Document.findOne({
      _id: req.params.id,
      ...getAccessFilter(req.user),
    });

    if (!document) {
      return res.status(404).json({
        message: "Document not found",
      });
    }

    if (document.status !== "completed") {
      return res.status(400).json({
        message: "Document ingestion must finish first",
      });
    }

    const result = await embedDocumentChunks(document._id);

    return res.status(200).json({
      message: "Document embeddings generated successfully",
      documentId: document._id,
      ...result,
    });
  } catch (error) {
    console.error("Embedding generation error:", error);

    return res.status(500).json({
      message: "Could not generate document embeddings",
    });
  }
};


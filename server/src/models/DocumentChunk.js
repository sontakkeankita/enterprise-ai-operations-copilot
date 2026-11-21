
import mongoose from "mongoose";

const documentChunkSchema = new mongoose.Schema(
  {
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    chunkIndex: {
      type: Number,
      required: true,
    },

    metadata: {
      source: {
        type: String,
        required: true,
      },

      department: {
        type: String,
        required: true,
      },

      uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },

    // Phase 4: embedding fields
    embedding: {
      type: [Number],
      default: undefined,
    },

    embeddingModel: {
      type: String,
      default: null,
    },

    embeddingDimensions: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "document_chunks",
  }
);

documentChunkSchema.index(
  { documentId: 1, chunkIndex: 1 },
  { unique: true }
);

documentChunkSchema.index({
  "metadata.department": 1,
});

const DocumentChunk = mongoose.model(
  "DocumentChunk",
  documentChunkSchema
);

export default DocumentChunk;

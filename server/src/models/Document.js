
import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    originalName: {
      type: String,
      required: true,
      trim: true,
    },

    mimeType: {
      type: String,
      required: true,
    },

    fileSize: {
      type: Number,
      required: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["processing", "completed", "failed"],
      default: "processing",
    },

    chunkCount: {
      type: Number,
      default: 0,
    },

    extractedTextLength: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

documentSchema.index({ department: 1, createdAt: -1 });
documentSchema.index({ uploadedBy: 1, createdAt: -1 });

const Document = mongoose.model("Document", documentSchema);

export default Document;

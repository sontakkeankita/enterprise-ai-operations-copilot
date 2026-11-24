
import mongoose from "mongoose";

const evaluationSchema = new mongoose.Schema(
  {
    evaluationType: {
      type: String,
      enum: [
        "RAG_RETRIEVAL",
        "ANSWER_QUALITY",
        "AGENT",
        "MCP_TOOL",
        "PERFORMANCE",
      ],
      required: true,
    },

    testCaseId: {
      type: String,
      default: null,
    },

    question: {
      type: String,
      default: null,
    },

    metrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    passed: {
      type: Boolean,
      default: false,
    },

    durationMs: {
      type: Number,
      default: null,
    },

    model: {
      type: String,
      default: null,
    },

    tokenUsage: {
      promptTokens: {
        type: Number,
        default: null,
      },
      completionTokens: {
        type: Number,
        default: null,
      },
      totalTokens: {
        type: Number,
        default: null,
      },
    },

    error: {
      type: String,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

evaluationSchema.index({
  evaluationType: 1,
  createdAt: -1,
});

evaluationSchema.index({
  testCaseId: 1,
  createdAt: -1,
});

const Evaluation =
  mongoose.models.Evaluation ||
  mongoose.model("Evaluation", evaluationSchema, "evaluations");

export default Evaluation;

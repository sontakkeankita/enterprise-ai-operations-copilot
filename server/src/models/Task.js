import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    department: {
      type: String,
      enum: ["IT", "HR", "Finance", "Operations"],
      required: true,
    },

    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },

    status: {
      type: String,
      enum: [
        "PENDING_APPROVAL",
        "OPEN",
        "IN_PROGRESS",
        "COMPLETED",
        "REJECTED",
      ],
      default: "PENDING_APPROVAL",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Task =
  mongoose.models.Task ||
  mongoose.model("Task", taskSchema, "tasks");

export default Task;
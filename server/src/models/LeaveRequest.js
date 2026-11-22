import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: [
        "PENDING_APPROVAL",
        "APPROVED",
        "REJECTED",
      ],
      default: "PENDING_APPROVAL",
    },
  },
  { timestamps: true }
);

const LeaveRequest =
  mongoose.models.LeaveRequest ||
  mongoose.model(
    "LeaveRequest",
    leaveRequestSchema,
    "leave_requests"
  );

export default LeaveRequest;
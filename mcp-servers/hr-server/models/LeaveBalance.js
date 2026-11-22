import mongoose from "mongoose";

const leaveBalanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "McpUser",
      required: true,
      unique: true,
    },

    annualLeaveDays: {
      type: Number,
      required: true,
      min: 0,
    },

    usedLeaveDays: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const LeaveBalance =
  mongoose.models.LeaveBalance ||
  mongoose.model(
    "LeaveBalance",
    leaveBalanceSchema,
    "leave_balances"
  );

export default LeaveBalance;
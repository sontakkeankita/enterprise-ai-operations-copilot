
const createApprovalModel = (mongoose) => {
  const approvalSchema = new mongoose.Schema(
    {
      actionType: {
        type: String,
        enum: ["TASK_CREATE", "LEAVE_REQUEST_CREATE"],
        required: true,
      },

      targetCollection: {
        type: String,
        enum: ["tasks", "leave_requests"],
        required: true,
      },

      targetId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },

      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      payload: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },

      status: {
        type: String,
        enum: ["PENDING", "APPROVED", "REJECTED"],
        default: "PENDING",
      },

      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },

      reviewedAt: {
        type: Date,
        default: null,
      },

      rejectionReason: {
        type: String,
        default: null,
      },

      executionStatus: {
        type: String,
        enum: ["NOT_EXECUTED", "COMPLETED", "FAILED"],
        default: "NOT_EXECUTED",
      },

      executedAt: {
        type: Date,
        default: null,
      },

      executionError: {
        type: String,
        default: null,
      },
    },
    { timestamps: true }
  );

  approvalSchema.index(
    { targetCollection: 1, targetId: 1 },
    { unique: true }
  );

  approvalSchema.index({ status: 1, createdAt: -1 });

  approvalSchema.index({ requestedBy: 1, createdAt: -1 });

  return (
    mongoose.models.Approval ||
    mongoose.model("Approval", approvalSchema, "approvals")
  );
};

export default createApprovalModel;


import mongoose from "mongoose";

import Approval from "../../models/Approval.js";
import AuditLog from "../../models/AuditLog.js";
import Task from "../../models/Task.js";
import LeaveRequest from "../../models/LeaveRequest.js";

const executeApprovedAction = async (
  approval,
  session
) => {
  if (approval.targetCollection === "tasks") {
    const result = await Task.updateOne(
      {
        _id: approval.targetId,
        status: "PENDING_APPROVAL",
      },
      {
        $set: {
          status: "OPEN",
        },
      },
      { session }
    );

    if (result.modifiedCount !== 1) {
      throw new Error(
        "Task was not found or is no longer pending approval"
      );
    }

    return;
  }

  if (approval.targetCollection === "leave_requests") {
    const result = await LeaveRequest.updateOne(
      {
        _id: approval.targetId,
        status: "PENDING_APPROVAL",
      },
      {
        $set: {
          status: "APPROVED",
        },
      },
      { session }
    );

    if (result.modifiedCount !== 1) {
      throw new Error(
        "Leave request was not found or is no longer pending approval"
      );
    }

    return;
  }

  throw new Error(
    "Unsupported approval action"
  );
};

// ----------------------------------
// APPROVE REQUEST
// ----------------------------------

export const approveRequest = async ({
  approvalId,
  reviewer,
  requestMetadata,
}) => {
  if (!mongoose.Types.ObjectId.isValid(approvalId)) {
    throw new Error("Invalid approval ID");
  }

  const session = await mongoose.startSession();

  let approved;

  try {
    await session.withTransaction(async () => {
      const approval = await Approval.findOne({
        _id: approvalId,
        status: "PENDING",
      }).session(session);

      if (!approval) {
        throw new Error(
          "Approval not found or already reviewed"
        );
      }

      if (
        approval.requestedBy.toString() ===
        reviewer._id.toString()
      ) {
        throw new Error(
          "You cannot approve your own request"
        );
      }

      // Revalidate the reviewer's role.
      if (reviewer.role !== "admin") {
        throw new Error(
          "You are not authorized to approve requests"
        );
      }

      await executeApprovedAction(
        approval,
        session
      );

      approval.status = "APPROVED";
      approval.reviewedBy = reviewer._id;
      approval.reviewedAt = new Date();
      approval.executionStatus = "COMPLETED";
      approval.executedAt = new Date();
      approval.executionError = null;

      await approval.save({ session });

      await AuditLog.create(
        [
          {
            actorId: reviewer._id,
            action: "APPROVAL_APPROVED",
            resourceType: "approval",
            resourceId: approval._id,

            metadata: {
              targetCollection:
                approval.targetCollection,

              targetId: approval.targetId,

              requestedBy: approval.requestedBy,

              executionStatus: "COMPLETED",
            },

            ipAddress:
              requestMetadata?.ipAddress ?? null,

            userAgent:
              requestMetadata?.userAgent ?? null,
          },

          {
            actorId: reviewer._id,
            action: "APPROVED_ACTION_EXECUTED",
            resourceType: approval.targetCollection,
            resourceId: approval.targetId,

            metadata: {
              approvalId: approval._id,
            },

            ipAddress:
              requestMetadata?.ipAddress ?? null,

            userAgent:
              requestMetadata?.userAgent ?? null,
          },
        ],
        { session }
      );

      approved = approval;
    });

    return approved;

  } finally {
    await session.endSession();
  }
};

// ----------------------------------
// REJECT REQUEST
// ----------------------------------

export const rejectRequest = async ({
  approvalId,
  reviewer,
  reason,
  requestMetadata,
}) => {
  if (!mongoose.Types.ObjectId.isValid(approvalId)) {
    throw new Error("Invalid approval ID");
  }

  if (
    typeof reason !== "string" ||
    !reason.trim() ||
    reason.trim().length > 1000
  ) {
    throw new Error(
      "A rejection reason between 1 and 1000 characters is required"
    );
  }

  const session = await mongoose.startSession();

  let rejected;

  try {
    await session.withTransaction(async () => {
      const approval = await Approval.findOne({
        _id: approvalId,
        status: "PENDING",
      }).session(session);

      if (!approval) {
        throw new Error(
          "Approval not found or already reviewed"
        );
      }

      if (
        approval.requestedBy.toString() ===
        reviewer._id.toString()
      ) {
        throw new Error(
          "You cannot reject your own request"
        );
      }

      if (reviewer.role !== "admin") {
        throw new Error(
          "You are not authorized to reject requests"
        );
      }

      const targetCollection =
        approval.targetCollection === "tasks"
          ? "tasks"
          : "leave_requests";

      const targetModel =
        targetCollection === "tasks"
          ? Task
          : LeaveRequest;

      const target = await targetModel.findOne({
        _id: approval.targetId,
        status: "PENDING_APPROVAL",
      }).session(session);

      if (!target) {
        throw new Error(
          "The original request is no longer pending"
        );
      }

      target.status = "REJECTED";
      await target.save({ session });

      approval.status = "REJECTED";
      approval.reviewedBy = reviewer._id;
      approval.reviewedAt = new Date();
      approval.rejectionReason = reason.trim();

      await approval.save({ session });

      await AuditLog.create(
        [
          {
            actorId: reviewer._id,
            action: "APPROVAL_REJECTED",
            resourceType: "approval",
            resourceId: approval._id,

            metadata: {
              targetCollection,
              targetId: approval.targetId,
              requestedBy: approval.requestedBy,
              reason: reason.trim(),
            },

            ipAddress:
              requestMetadata?.ipAddress ?? null,

            userAgent:
              requestMetadata?.userAgent ?? null,
          },
        ],
        { session }
      );

      rejected = approval;
    });

    return rejected;

  } finally {
    await session.endSession();
  }
};

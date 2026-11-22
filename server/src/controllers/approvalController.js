
import mongoose from "mongoose";

import Approval from "../models/Approval.js";
import AuditLog from "../models/AuditLog.js";

import {
  approveRequest,
  rejectRequest,
} from "../services/approvals/approvalService.js";

// ----------------------------------
// ADMIN: LIST APPROVALS
// ----------------------------------

export const getApprovals = async (req, res) => {
  try {
    const status = req.query.status || "PENDING";

    const allowedStatuses = [
      "PENDING",
      "APPROVED",
      "REJECTED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid approval status",
      });
    }

    const approvals = await Approval.find({
      status,
    })
      .populate("requestedBy", "name email department role")
      .populate("reviewedBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      count: approvals.length,
      approvals,
    });

  } catch (error) {
    console.error("Get approvals error:", error.message);

    return res.status(500).json({
      message: "Unable to fetch approval requests",
    });
  }
};

// ----------------------------------
// EMPLOYEE: MY APPROVALS
// ----------------------------------

export const getMyApprovals = async (req, res) => {
  try {
    console.log("========== APPROVAL DEBUG ==========");

    console.log(
      "Default MongoDB connection:",
      mongoose.connection.readyState
    );

    console.log(
      "Approval model connection:",
      Approval.db.readyState
    );

    console.log(
      "Approval database:",
      Approval.db.name
    );

    console.log(
      "Approval collection:",
      Approval.collection.name
    );

    console.log(
      "Authenticated user:",
      req.user?._id
    );

    console.log("====================================");

    const approvals = await Approval.find({
      requestedBy: req.user._id,
    })
      .populate("reviewedBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      count: approvals.length,
      approvals,
    });

  } catch (error) {
    console.error(
      "Get my approvals error:",
      error
    );

    return res.status(500).json({
      message: "Unable to fetch your requests",
    });
  }
};

// ----------------------------------
// ADMIN: APPROVE
// ----------------------------------

export const approveApproval = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid approval ID",
      });
    }

    const approval = await approveRequest({
      approvalId: id,
      reviewer: req.user,

      requestMetadata: {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      },
    });

    return res.status(200).json({
      message: "Request approved and executed successfully",
      approval,
    });

  } catch (error) {
    console.error(
      "Approve request error:",
      error.message
    );

    const clientErrors = [
      "Approval not found or already reviewed",
      "You cannot approve your own request",
      "You are not authorized to approve requests",
      "Task was not found or is no longer pending approval",
      "Leave request was not found or is no longer pending approval",
      "Unsupported approval action",
    ];

    if (clientErrors.includes(error.message)) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Unable to approve request",
    });
  }
};

// ----------------------------------
// ADMIN: REJECT
// ----------------------------------

export const rejectApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid approval ID",
      });
    }

    const approval = await rejectRequest({
      approvalId: id,
      reviewer: req.user,
      reason,

      requestMetadata: {
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      },
    });

    return res.status(200).json({
      message: "Request rejected successfully",
      approval,
    });

  } catch (error) {
    console.error(
      "Reject request error:",
      error.message
    );

    const clientErrors = [
      "Approval not found or already reviewed",
      "You cannot reject your own request",
      "You are not authorized to approve requests",
      "The original request is no longer pending",
    ];

    if (
      clientErrors.includes(error.message) ||
      error.message.startsWith("A rejection reason")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Unable to reject request",
    });
  }
};

// ----------------------------------
// ADMIN: AUDIT LOGS
// ----------------------------------

export const getAuditLogs = async (req, res) => {
  try {
    const limit = Number(req.query.limit ?? 50);

    if (
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return res.status(400).json({
        message: "Limit must be between 1 and 100",
      });
    }

    const filter = {};

    if (req.query.resourceType) {
      filter.resourceType = req.query.resourceType;
    }

    const logs = await AuditLog.find(filter)
      .populate("actorId", "name email role")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return res.status(200).json({
      count: logs.length,
      logs,
    });

  } catch (error) {
    console.error("Audit log error:", error.message);

    return res.status(500).json({
      message: "Unable to fetch audit logs",
    });
  }
};

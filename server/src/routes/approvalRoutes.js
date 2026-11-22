import express from "express";

import {
  protect,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

import {
  getApprovals,
  getMyApprovals,
  approveApproval,
  rejectApproval,
  getAuditLogs,
} from "../controllers/approvalController.js";

const router = express.Router();

// Every route requires authentication.
router.use(protect);

// Any authenticated employee can see their own requests.
router.get("/my", getMyApprovals);

// Only admins can view all approval requests.
router.get(
  "/",
  authorizeRoles("admin"),
  getApprovals
);

// Only admins can approve or reject.
router.post(
  "/:id/approve",
  authorizeRoles("admin"),
  approveApproval
);

router.post(
  "/:id/reject",
  authorizeRoles("admin"),
  rejectApproval
);

// Only admins can view audit logs.
router.get(
  "/audit-logs",
  authorizeRoles("admin"),
  getAuditLogs
);

export default router;
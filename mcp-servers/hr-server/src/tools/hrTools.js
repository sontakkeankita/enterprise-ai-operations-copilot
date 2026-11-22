
import { z } from "zod";

import LeaveRequest from "../../models/LeaveRequest.js";
import LeaveBalance from "../../models/LeaveBalance.js";

import {
  getCurrentUser,
} from "../../../shared/getCurrentUser.js";

import mongoose from "mongoose";

import createApprovalModel from "../../../shared/Approval.js";
import createAuditLogModel from "../../../shared/AuditLog.js";

const Approval = createApprovalModel(mongoose);
const AuditLog = createAuditLogModel(mongoose);

const textResult = (data) => ({
  content: [
    {
      type: "text",
      text: JSON.stringify(data),
    },
  ],
});

export const registerHRTools = (server) => {

  // ----------------------------------
  // TOOL 1: CREATE LEAVE REQUEST
  // ----------------------------------

  server.registerTool(
    "create_leave_request",
    {
      description:
        "Create a leave request proposal for the currently authenticated employee. The request remains pending approval.",

      inputSchema: {
        startDate: z.string().min(10).max(30),

        endDate: z.string().min(10).max(30),

        reason: z.string().trim().min(5).max(1000),
      },
    },

    async ({ startDate, endDate, reason }) => {
      try {
        const user = await getCurrentUser();

        const start = new Date(startDate);
        const end = new Date(endDate);

        if (
          Number.isNaN(start.getTime()) ||
          Number.isNaN(end.getTime())
        ) {
          throw new Error("Invalid leave dates");
        }

        if (end < start) {
          throw new Error(
            "End date cannot be before start date"
          );
        }

        const session = await mongoose.startSession();

        let request;
        let approval;

        try {
          await session.withTransaction(async () => {
            const createdRequests = await LeaveRequest.create(
              [
                {
                  employeeId: user._id,
                  startDate: start,
                  endDate: end,
                  reason,
                  status: "PENDING_APPROVAL",
                },
              ],
              { session }
            );

            request = createdRequests[0];

            const createdApprovals = await Approval.create(
              [
                {
                  actionType: "LEAVE_REQUEST_CREATE",
                  targetCollection: "leave_requests",
                  targetId: request._id,
                  requestedBy: user._id,

                  payload: {
                    startDate: start,
                    endDate: end,
                    reason,
                  },

                  status: "PENDING",
                  executionStatus: "NOT_EXECUTED",
                },
              ],
              { session }
            );

            approval = createdApprovals[0];

            await AuditLog.create(
              [
                {
                  actorId: user._id,
                  action: "LEAVE_REQUEST_CREATED",
                  resourceType: "leave_request",
                  resourceId: request._id,

                  metadata: {
                    approvalId: approval._id,
                    status: "PENDING_APPROVAL",
                  },
                },
              ],
              { session }
            );
          });
        } finally {
          await session.endSession();
        }

        return textResult({
          success: true,
          message: "Leave request submitted for approval",

          request: {
            id: request._id,
            startDate: request.startDate,
            endDate: request.endDate,
            reason: request.reason,
            status: request.status,
          },

          approval: {
            id: approval._id,
            status: approval.status,
          },
        });

      } catch (error) {
        return {
          ...textResult({
            success: false,
            message: error.message,
          }),
          isError: true,
        };
      }
    }
  );

  // ----------------------------------
  // TOOL 2: GET EMPLOYEE DETAILS
  // ----------------------------------

  server.registerTool(
    "get_employee_details",
    {
      description:
        "Retrieve the basic profile details of the currently authenticated employee.",

      inputSchema: {},
    },

    async () => {
      try {
        const user = await getCurrentUser();

        return textResult({
          success: true,
          employee: {
            id: user._id,
            name: user.name,
            email: user.email,
            department: user.department,
            role: user.role,
          },
        });

      } catch (error) {
        return {
          ...textResult({
            success: false,
            message: error.message,
          }),
          isError: true,
        };
      }
    }
  );

  // ----------------------------------
  // TOOL 3: GET LEAVE BALANCE
  // ----------------------------------

  server.registerTool(
    "get_leave_balance",
    {
      description:
        "Retrieve the leave balance configured for the currently authenticated employee.",

      inputSchema: {},
    },

    async () => {
      try {
        const user = await getCurrentUser();

        const balance = await LeaveBalance.findOne({
          employeeId: user._id,
        }).lean();

        if (!balance) {
          return textResult({
            success: false,
            status: "NOT_CONFIGURED",
            message:
              "No leave balance has been configured for this employee.",
          });
        }

        const remainingLeaveDays =
          balance.annualLeaveDays -
          balance.usedLeaveDays;

        return textResult({
          success: true,
          leaveBalance: {
            annualLeaveDays: balance.annualLeaveDays,
            usedLeaveDays: balance.usedLeaveDays,
            remainingLeaveDays,
          },
        });

      } catch (error) {
        return {
          ...textResult({
            success: false,
            message: error.message,
          }),
          isError: true,
        };
      }
    }
  );
};

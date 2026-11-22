import { z } from "zod";

import Task from "../../models/Task.js";

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

export const registerTaskTools = (server) => {

  // ----------------------------------
  // TOOL 1: CREATE TASK
  // ----------------------------------

  server.registerTool(
    "create_task",
    {
      description:
        "Create a task proposal for a company department. The task remains pending approval.",

      inputSchema: {
        title: z.string().trim().min(3).max(150),

        description: z.string().trim().min(5).max(1000),

        department: z.enum([
          "IT",
          "HR",
          "Finance",
          "Operations",
        ]),

        priority: z.enum([
          "low",
          "medium",
          "high",
        ]),
      },
    },

    async ({
      title,
      description,
      department,
      priority,
    }) => {
      try {
        const user = await getCurrentUser();

        const session = await mongoose.startSession();

let task;
let approval;

try {
  await session.withTransaction(async () => {
    const createdTasks = await Task.create(
      [
        {
          title,
          description,
          department,
          priority,
          createdBy: user._id,
          status: "PENDING_APPROVAL",
        },
      ],
      { session }
    );

    task = createdTasks[0];

    const createdApprovals = await Approval.create(
      [
        {
          actionType: "TASK_CREATE",
          targetCollection: "tasks",
          targetId: task._id,
          requestedBy: user._id,

          payload: {
            title,
            description,
            department,
            priority,
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
          action: "TASK_PROPOSAL_CREATED",
          resourceType: "task",
          resourceId: task._id,

          metadata: {
            approvalId: approval._id,
            status: "PENDING_APPROVAL",
            department,
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
  message: "Task proposal submitted for approval",

  task: {
    id: task._id,
    title: task.title,
    department: task.department,
    priority: task.priority,
    status: task.status,
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
  // TOOL 2: GET TASK
  // ----------------------------------

  server.registerTool(
    "get_task",
    {
      description:
        "Retrieve a task by its ID, if the current employee is allowed to access it.",

      inputSchema: {
        taskId: z.string().min(1),
      },
    },

    async ({ taskId }) => {
      try {
        const user = await getCurrentUser();

        if (!/^[a-f\d]{24}$/i.test(taskId)) {
          throw new Error("Invalid task ID");
        }

        const task = await Task.findById(taskId);

        if (!task) {
          throw new Error("Task not found");
        }

        const isOwner =
          task.createdBy.toString() === user._id.toString();

        if (user.role !== "admin" && !isOwner) {
          throw new Error("You cannot access this task");
        }

        return textResult({
          success: true,
          task,
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
  // TOOL 3: UPDATE TASK
  // ----------------------------------

  server.registerTool(
    "update_task",
    {
      description:
        "Update the title, description or priority of a task that is still pending approval.",

      inputSchema: {
        taskId: z.string().min(1),

        title: z.string().trim().min(3).max(150).optional(),

        description: z.string().trim().min(5).max(1000).optional(),

        priority: z.enum([
          "low",
          "medium",
          "high",
        ]).optional(),
      },
    },

    async ({
      taskId,
      title,
      description,
      priority,
    }) => {
      try {
        const user = await getCurrentUser();

        if (!/^[a-f\d]{24}$/i.test(taskId)) {
          throw new Error("Invalid task ID");
        }

        const updates = {};

        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (priority !== undefined) updates.priority = priority;

        if (Object.keys(updates).length === 0) {
          throw new Error("Provide at least one field to update");
        }

        const task = await Task.findById(taskId);

        if (!task) {
          throw new Error("Task not found");
        }

        const isOwner =
          task.createdBy.toString() === user._id.toString();

        if (user.role !== "admin" && !isOwner) {
          throw new Error("You cannot update this task");
        }

        if (task.status !== "PENDING_APPROVAL") {
          throw new Error(
            "Only pending task proposals can be updated"
          );
        }

        Object.assign(task, updates);

        await task.save();

        return textResult({
          success: true,
          message: "Task proposal updated",
          task,
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
  // TOOL 4: LIST TASKS
  // ----------------------------------

  server.registerTool(
    "list_tasks",
    {
      description:
        "List tasks accessible to the current employee. Admins can see all tasks.",

      inputSchema: {
        status: z.enum([
          "PENDING_APPROVAL",
          "OPEN",
          "IN_PROGRESS",
          "COMPLETED",
          "REJECTED",
        ]).optional(),

        limit: z.number().int().min(1).max(50).optional(),
      },
    },

    async ({ status, limit }) => {
      try {
        const user = await getCurrentUser();

        const filter = {};

        if (user.role !== "admin") {
          filter.createdBy = user._id;
        }

        if (status) {
          filter.status = status;
        }

        const tasks = await Task.find(filter)
          .sort({ createdAt: -1 })
          .limit(limit ?? 10)
          .lean();

        return textResult({
          success: true,
          count: tasks.length,
          tasks,
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
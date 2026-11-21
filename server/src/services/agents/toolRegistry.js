
import { z } from "zod";

import {
  answerWithRag,
} from "../rag/ragAnswerService.js";

// ------------------------------------
// Tool 1: Search company knowledge
// ------------------------------------

const KnowledgeSchema = z.object({
  query: z.string().trim().min(3).max(1000),
  limit: z.number().int().min(1).max(5).default(5),
});

const searchCompanyKnowledge = async (args, user) => {
  const input = KnowledgeSchema.parse(args);

  return await answerWithRag({
    question: input.query,
    user,
    limit: input.limit,
  });
};

// ------------------------------------
// Tool 2: Prepare a task
// ------------------------------------

const TaskSchema = z.object({
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
});

const prepareTask = async (args, user) => {
  const input = TaskSchema.parse(args);

  return {
    status: "PROPOSED",
    message: "Task proposal prepared. No task has been created.",
    proposedAction: {
      action: "create_task",
      ...input,
      requestedBy: user._id.toString(),
    },
  };
};

// ------------------------------------
// Tool 3: Prepare an HR request
// ------------------------------------

const HRRequestSchema = z.object({
  requestType: z.enum([
    "leave",
    "remote_work",
    "other",
  ]),
  details: z.string().trim().min(5).max(1000),
});

const prepareHRRequest = async (args, user) => {
  const input = HRRequestSchema.parse(args);

  return {
    status: "PROPOSED",
    message: "HR request proposal prepared. No request has been submitted.",
    proposedAction: {
      action: "create_hr_request",
      ...input,
      requestedBy: user._id.toString(),
    },
  };
};

// ------------------------------------
// Available tools for the AI planner
// ------------------------------------

export const getAvailableTools = () => [
  {
    name: "search_company_knowledge",
    description:
      "Search authorized company documents and answer an employee's knowledge question.",
    arguments: {
      query: "string",
      limit: "number, optional, 1 to 5",
    },
  },
  {
    name: "prepare_task",
    description:
      "Prepare a task proposal for a company department. Does not create a real task.",
    arguments: {
      title: "string",
      description: "string",
      department: "IT | HR | Finance | Operations",
      priority: "low | medium | high",
    },
  },
  {
    name: "prepare_hr_request",
    description:
      "Prepare a leave or remote-work request proposal. Does not submit a real request.",
    arguments: {
      requestType: "leave | remote_work | other",
      details: "string",
    },
  },
];

// ------------------------------------
// Tool execution
// ------------------------------------

const toolHandlers = {
  search_company_knowledge: searchCompanyKnowledge,
  prepare_task: prepareTask,
  prepare_hr_request: prepareHRRequest,
};

export const executeTool = async (
  toolName,
  args,
  user
) => {
  const handler = toolHandlers[toolName];

  if (!handler) {
    throw new Error(`Tool is not registered: ${toolName}`);
  }

  return await handler(args, user);
};

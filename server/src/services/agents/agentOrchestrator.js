
import {
  detectIntent,
} from "./intentService.js";

import {
  createAgentPlan,
} from "./plannerService.js";

import {
  getAvailableTools,
  executeTool,
} from "./toolRegistry.js";

import {
  connectMcpServers,
  discoverMcpCapabilities,
} from "../mcp/mcpClientService.js";

const ACTION_TOOLS = [
  "create_task",
  "get_task",
  "update_task",
  "list_tasks",
  "create_leave_request",
  "get_employee_details",
  "get_leave_balance",
];

const getAllowedTools = (intent) => {
  if (intent === "knowledge_question") {
    return ["search_company_knowledge"];
  }

  if (intent === "action_request") {
    return ACTION_TOOLS;
  }

  if (intent === "mixed_request") {
    return [
      "search_company_knowledge",
      ...ACTION_TOOLS,
    ];
  }

  return [];
};

export const runAgent = async ({
  question,
  user,
}) => {
  let mcpClients = null;

  try {
    // Step 1: Detect intent
    const detected = await detectIntent(question);

    if (detected.intent === "general_conversation") {
      return {
        intent: detected.intent,
        message:
          "Hello! I can help you search company documents, prepare tasks and prepare HR requests.",
        plan: [],
        results: [],
      };
    }

    if (detected.intent === "unsupported") {
      return {
        intent: detected.intent,
        message:
          "This request is outside the current capabilities of the Enterprise AI Copilot.",
        plan: [],
        results: [],
      };
    }

    // Step 2: Connect MCP servers only when required
    let capabilities = null;

    if (
      detected.intent === "action_request" ||
      detected.intent === "mixed_request"
    ) {
      mcpClients = await connectMcpServers(user);

      capabilities =
        await discoverMcpCapabilities(mcpClients);
    }

    // Step 3: Get available tools
    const availableTools =
      getAvailableTools(capabilities);

    // Step 4: Create plan
    const plan = await createAgentPlan({
      question,
      intent: detected.intent,
      availableTools,
    });

    if (
      plan.needsClarification ||
      plan.steps.length === 0
    ) {
      return {
        intent: detected.intent,
        message:
          plan.needsClarification ||
          "Please provide more information.",
        plan: [],
        results: [],
      };
    }

    // Step 5: Validate tools against intent
    const allowedTools = new Set(
      getAllowedTools(detected.intent)
    );

    for (const step of plan.steps) {
      if (!allowedTools.has(step.toolName)) {
        throw new Error(
          `Tool ${step.toolName} is not allowed for this intent`
        );
      }
    }

    // Step 6: Execute tools sequentially
    const results = [];

    for (const step of plan.steps) {
      try {
        const result = await executeTool(
          step.toolName,
          step.arguments,
          user,
          mcpClients
        );

        results.push({
          toolName: step.toolName,
          status: "success",
          result,
        });

      } catch (error) {
        results.push({
          toolName: step.toolName,
          status: "failed",
          error: error.message,
        });

        break;
      }
    }

    const awaitingApproval = results.some(
  ({ result }) =>
    result?.approval?.status === "PENDING"
);

return {
  intent: detected.intent,
  summary: detected.summary,

  message: awaitingApproval
    ? "Your request has been submitted successfully and is waiting for admin approval."
    : "Agent execution completed.",

  plan: plan.steps,
  results,
};

  } finally {
    // Always close the child processes.
    if (mcpClients) {
      await mcpClients.close();
    }
  }
};

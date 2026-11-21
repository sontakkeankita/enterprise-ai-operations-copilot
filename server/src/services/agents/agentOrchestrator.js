
import {
  detectIntent,
} from "./intentService.js";

import {
  createAgentPlan,
} from "./plannerService.js";

import {
  executeTool,
} from "./toolRegistry.js";

const ALLOWED_TOOLS_BY_INTENT = {
  knowledge_question: [
    "search_company_knowledge",
  ],

  action_request: [
    "prepare_task",
    "prepare_hr_request",
  ],

  mixed_request: [
    "search_company_knowledge",
    "prepare_task",
    "prepare_hr_request",
  ],
};

export const runAgent = async ({
  question,
  user,
}) => {
  // Step 1: Detect intent
  const detected = await detectIntent(question);

  if (detected.intent === "general_conversation") {
    return {
      intent: detected.intent,
      message:
        "Hello! I can help you search company documents, prepare tasks, and prepare HR requests.",
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

  // Step 2: Create plan
  const plan = await createAgentPlan({
    question,
    intent: detected.intent,
  });

  if (plan.needsClarification || plan.steps.length === 0) {
    return {
      intent: detected.intent,
      message:
        plan.needsClarification ||
        "Please provide more information so I can prepare the correct plan.",
      plan: [],
      results: [],
    };
  }

  // Step 3: Validate tools allowed for this intent
  const allowedTools =
    ALLOWED_TOOLS_BY_INTENT[detected.intent];

  if (!allowedTools) {
    throw new Error("Unsupported agent intent");
  }

  for (const step of plan.steps) {
    if (!allowedTools.includes(step.toolName)) {
      throw new Error(
        `Tool ${step.toolName} is not allowed for this intent`
      );
    }
  }

  // Step 4: Execute tools sequentially
  const results = [];

  for (const step of plan.steps) {
    try {
      const result = await executeTool(
        step.toolName,
        step.arguments,
        user
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

      // Stop if a step fails.
      break;
    }
  }

  // Step 5: Return the agent result
  return {
    intent: detected.intent,
    summary: detected.summary,
    message: "Agent execution completed.",
    plan: plan.steps,
    results,
  };
};

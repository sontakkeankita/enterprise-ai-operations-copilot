
import {
  gemini,
  GEMINI_CHAT_MODEL,
} from "../../config/gemini.js";

import { z } from "zod";

const PlanSchema = z.object({
  steps: z.array(
    z.object({
      toolName: z.string().min(1),

      arguments: z.record(
        z.string(),
        z.unknown()
      ),
    })
  ).max(3),

  needsClarification: z.string().max(500).default(""),
});

const parseJson = (text) => {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error(
      "Gemini returned an empty planning response"
    );
  }

  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");

  return JSON.parse(cleaned);
};

export const createAgentPlan = async ({
  question,
  intent,
  availableTools,
}) => {
  if (
    !Array.isArray(availableTools) ||
    availableTools.length === 0
  ) {
    throw new Error("No tools are available");
  }

  const response = await gemini.models.generateContent({
    model: GEMINI_CHAT_MODEL,

    contents: `
You are a controlled enterprise AI agent planner.

Detected intent:
${intent}

Employee request:
<BEGIN_EMPLOYEE_REQUEST>
${question}
<END_EMPLOYEE_REQUEST>

Available tools:
${JSON.stringify(availableTools, null, 2)}

Rules:

1. Select tools only from the available tools list.
2. Use the exact tool names provided.
3. Never invent tool names.
4. Return a maximum of 3 steps.
5. Use search_company_knowledge for company document questions.
6. Use task tools for task-related requests.
7. Use HR tools for employee and leave-related requests.
8. For mixed requests, use the required tools in a sensible order.
9. Do not invent missing employee information.
10. If required details are missing, return an empty steps array
    and explain what information is needed.
11. Never execute tools. Only prepare a plan.
12. Do not claim that a request has been approved.

Return ONLY valid JSON:

{
  "steps": [
    {
      "toolName": "create_task",
      "arguments": {
        "title": "Fix employee laptop",
        "description": "Investigate and fix the laptop issue",
        "department": "IT",
        "priority": "high"
      }
    }
  ],
  "needsClarification": ""
}
`,

    config: {
      systemInstruction:
        "You are a controlled planning component. Return valid JSON only. Never execute actions.",

      responseMimeType: "application/json",
    },
  });

  const parsed = parseJson(response.text);

  const plan = PlanSchema.parse(parsed);

  // Verify every selected tool was discovered.
  const allowedTools = new Set(
    availableTools.map((tool) => tool.name)
  );

  for (const step of plan.steps) {
    if (!allowedTools.has(step.toolName)) {
      throw new Error(
        `Planner selected an unknown tool: ${step.toolName}`
      );
    }
  }

  return plan;
};

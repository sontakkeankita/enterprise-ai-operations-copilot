
import {
  gemini,
  GEMINI_CHAT_MODEL,
} from "../../config/gemini.js";

import { z } from "zod";

import {
  getAvailableTools,
} from "./toolRegistry.js";

const PlanSchema = z.object({
  steps: z.array(
    z.object({
      toolName: z.enum([
        "search_company_knowledge",
        "prepare_task",
        "prepare_hr_request",
      ]),
      arguments: z.record(z.string(), z.unknown()),
    })
  ).max(3),

  needsClarification: z.string().max(500).default(""),
});

const parseJson = (text) => {
  if (typeof text !== "string" || !text.trim()) {
    throw new Error("Gemini returned an empty planning response");
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
}) => {
  const tools = getAvailableTools();

  const response = await gemini.models.generateContent({
    model: GEMINI_CHAT_MODEL,

    contents: `
You are a controlled enterprise AI agent planner.

Your job is to create a plan using ONLY the registered tools.

Detected intent:
${intent}

Employee request:
<BEGIN_EMPLOYEE_REQUEST>
${question}
<END_EMPLOYEE_REQUEST>

Available tools:
${JSON.stringify(tools, null, 2)}

Rules:

1. Never invent a tool name.
2. Use only tools from the available tools list.
3. Return no more than 3 steps.
4. Use search_company_knowledge for company policy questions.
5. Use prepare_task for task creation requests.
6. Use prepare_hr_request for HR requests.
7. For mixed requests, include the necessary tools in a sensible order.
8. Do not invent missing employee details.
9. If required information is missing, return an empty steps array
   and explain what needs clarification.
10. Never execute a tool. Only prepare the plan.

Return ONLY valid JSON in this structure:

{
  "steps": [
    {
      "toolName": "search_company_knowledge",
      "arguments": {
        "query": "What is the work-from-home policy?",
        "limit": 5
      }
    }
  ],
  "needsClarification": ""
}
`,

    config: {
      systemInstruction:
        "You are a planning component. You only create structured plans and never execute actions.",
      responseMimeType: "application/json",
    },
  });

  const parsed = parseJson(response.text);
  return PlanSchema.parse(parsed);
};

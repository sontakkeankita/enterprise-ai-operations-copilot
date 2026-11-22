
import {
  answerWithRag,
} from "../rag/ragAnswerService.js";

import {
  callMcpTool,
} from "../mcp/mcpClientService.js";

// ----------------------------------
// Build available tools
// ----------------------------------

export const getAvailableTools = (capabilities = null) => {
  const localTools = [
    {
      name: "search_company_knowledge",

      description:
        "Search authorized company documents and answer employee questions using RAG.",

      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Employee's knowledge question",
          },
          limit: {
            type: "number",
            description: "Number of search results, maximum 5",
          },
        },
        required: ["query"],
      },
    },
  ];

  if (!capabilities) {
    return localTools;
  }

  const taskTools = capabilities.task.tools.map(
    (tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      server: "task",
    })
  );

  const hrTools = capabilities.hr.tools.map(
    (tool) => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      server: "hr",
    })
  );

  return [
    ...localTools,
    ...taskTools,
    ...hrTools,
  ];
};

// ----------------------------------
// Execute selected tool
// ----------------------------------

export const executeTool = async (
  toolName,
  args,
  user,
  mcpClients
) => {
  // Local RAG tool
  if (toolName === "search_company_knowledge") {
    return await answerWithRag({
      question: args.query,
      user,
      limit: args.limit ?? 5,
    });
  }

  // MCP tool
  if (!mcpClients) {
    throw new Error(
      "MCP clients are not connected"
    );
  }

  return await callMcpTool(
    mcpClients,
    toolName,
    args
  );
};

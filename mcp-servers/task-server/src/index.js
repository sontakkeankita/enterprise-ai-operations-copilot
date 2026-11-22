import { McpServer } from
  "@modelcontextprotocol/sdk/server/mcp.js";

import { StdioServerTransport } from
  "@modelcontextprotocol/sdk/server/stdio.js";

import {
  connectDatabase,
} from "../../shared/connectDatabase.js";

import {
  registerTaskTools,
} from "./tools/taskTools.js";

import {
  registerTaskResources,
} from "./resources/taskResources.js";

import {
  registerTaskPrompts,
} from "./prompts/taskPrompts.js";

const main = async () => {
  await connectDatabase();

  const server = new McpServer({
    name: "enterprise-task-server",
    version: "1.0.0",
  });

  registerTaskTools(server);
  registerTaskResources(server);
  registerTaskPrompts(server);

  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("Task MCP Server started");
};

main().catch((error) => {
  console.error("Task MCP Server error:", error);
  process.exit(1);
});
import { McpServer } from
  "@modelcontextprotocol/sdk/server/mcp.js";

import { StdioServerTransport } from
  "@modelcontextprotocol/sdk/server/stdio.js";

import {
  connectDatabase,
} from "../../shared/connectDatabase.js";

import {
  registerHRTools,
} from "./tools/hrTools.js";

import {
  registerHRResources,
} from "./resources/hrResources.js";

import {
  registerHRPrompts,
} from "./prompts/hrPrompts.js";

const main = async () => {
  await connectDatabase();

  const server = new McpServer({
    name: "enterprise-hr-server",
    version: "1.0.0",
  });

  registerHRTools(server);
  registerHRResources(server);
  registerHRPrompts(server);

  const transport = new StdioServerTransport();

  await server.connect(transport);

  console.error("HR MCP Server started");
};

main().catch((error) => {
  console.error("HR MCP Server error:", error);
  process.exit(1);
});
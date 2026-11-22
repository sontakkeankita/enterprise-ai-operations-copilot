
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  Client,
} from "@modelcontextprotocol/sdk/client/index.js";

import {
  StdioClientTransport,
} from "@modelcontextprotocol/sdk/client/stdio.js";

const currentDir = path.dirname(
  fileURLToPath(import.meta.url)
);

const taskServerDirectory = path.resolve(
  currentDir,
  "../../../../mcp-servers/task-server"
);

const hrServerDirectory = path.resolve(
  currentDir,
  "../../../../mcp-servers/hr-server"
);

const connectToServer = async ({
  name,
  directory,
  entryFile,
  user,
}) => {
  const client = new Client({
    name: "enterprise-ai-copilot",
    version: "1.0.0",
  });

  const env = Object.fromEntries(
    Object.entries(process.env).filter(
      ([, value]) => typeof value === "string"
    )
  );

  // The authenticated backend user is passed to
  // the local MCP process, not selected by Gemini.
  env.COPILOT_USER_ID = user._id.toString();

  const transport = new StdioClientTransport({
    command: process.execPath,

    args: [entryFile],

    cwd: directory,

    env,

    stderr: "inherit",
  });

  await client.connect(transport);

  console.log(`${name} MCP client connected`);

  return client;
};

export const connectMcpServers = async (user) => {
  let taskClient;
  let hrClient;

  try {
    taskClient = await connectToServer({
      name: "Task",
      directory: taskServerDirectory,
      entryFile: path.join(
        taskServerDirectory,
        "src",
        "index.js"
      ),
      user,
    });

    hrClient = await connectToServer({
      name: "HR",
      directory: hrServerDirectory,
      entryFile: path.join(
        hrServerDirectory,
        "src",
        "index.js"
      ),
      user,
    });

    return {
      task: taskClient,
      hr: hrClient,

      close: async () => {
        await Promise.allSettled([
          taskClient.close(),
          hrClient.close(),
        ]);
      },
    };

  } catch (error) {
    await Promise.allSettled([
      taskClient?.close(),
      hrClient?.close(),
    ]);

    throw error;
  }
};

// ----------------------------------
// Discover server capabilities
// ----------------------------------

export const discoverMcpCapabilities = async (
  clients
) => {
  const [taskTools, hrTools] = await Promise.all([
    clients.task.listTools(),
    clients.hr.listTools(),
  ]);

  const [taskResources, hrResources] =
    await Promise.all([
      clients.task.listResources(),
      clients.hr.listResources(),
    ]);

  const [taskPrompts, hrPrompts] =
    await Promise.all([
      clients.task.listPrompts(),
      clients.hr.listPrompts(),
    ]);

  return {
    task: {
      tools: taskTools.tools,
      resources: taskResources.resources,
      prompts: taskPrompts.prompts,
    },

    hr: {
      tools: hrTools.tools,
      resources: hrResources.resources,
      prompts: hrPrompts.prompts,
    },
  };
};

// ----------------------------------
// Find and call an MCP tool
// ----------------------------------

export const callMcpTool = async (
  clients,
  toolName,
  args
) => {
  const [taskTools, hrTools] = await Promise.all([
    clients.task.listTools(),
    clients.hr.listTools(),
  ]);

  const taskToolExists = taskTools.tools.some(
    (tool) => tool.name === toolName
  );

  const hrToolExists = hrTools.tools.some(
    (tool) => tool.name === toolName
  );

  let selectedClient;

  if (taskToolExists && !hrToolExists) {
    selectedClient = clients.task;
  } else if (hrToolExists && !taskToolExists) {
    selectedClient = clients.hr;
  } else {
    throw new Error(
      `MCP tool not found or ambiguous: ${toolName}`
    );
  }

  const result = await selectedClient.callTool({
    name: toolName,
    arguments: args,
  });

  if (result.isError) {
    const errorText = result.content
      ?.filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n");

    throw new Error(
      errorText || `MCP tool failed: ${toolName}`
    );
  }

  const textContent = result.content
    ?.filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");

  if (!textContent) {
    return result;
  }

  try {
    return JSON.parse(textContent);
  } catch {
    return {
      message: textContent,
    };
  }
};

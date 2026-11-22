import {
  connectMcpServers,
  discoverMcpCapabilities,
} from "../services/mcp/mcpClientService.js";

export const getMcpCapabilities = async (req, res) => {
  let clients = null;

  try {
    clients = await connectMcpServers(req.user);

    const capabilities =
      await discoverMcpCapabilities(clients);

    // Test reading one resource from each server.
    const [taskResource, hrResource] =
      await Promise.all([
        clients.task.readResource({
          uri: "task://guidelines",
        }),

        clients.hr.readResource({
          uri: "hr://request-types",
        }),
      ]);

    // Test retrieving one prompt from each server.
    const [taskPrompt, hrPrompt] =
      await Promise.all([
        clients.task.getPrompt({
          name: "draft-task",
          arguments: {
            title: "Fix laptop",
            department: "IT",
            issue: "Employee laptop is not starting",
          },
        }),

        clients.hr.getPrompt({
          name: "draft-leave-request",
          arguments: {
            reason: "Personal work",
            startDate: "2026-12-01",
            endDate: "2026-12-02",
          },
        }),
      ]);

    return res.status(200).json({
      message: "MCP discovery successful",

      capabilities,

      resourceTests: {
        task: taskResource,
        hr: hrResource,
      },

      promptTests: {
        task: taskPrompt,
        hr: hrPrompt,
      },
    });

  } catch (error) {
    console.error(
      "MCP discovery error:",
      error.message
    );

    return res.status(500).json({
      message: "Unable to connect to MCP servers",
    });

  } finally {
    if (clients) {
      await clients.close();
    }
  }
};
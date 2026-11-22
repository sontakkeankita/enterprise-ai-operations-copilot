export const registerTaskResources = (server) => {
  server.registerResource(
    "task-guidelines",
    "task://guidelines",
    {
      title: "Task Guidelines",
      description:
        "Describes the task fields and proposal statuses supported by this server.",
      mimeType: "text/plain",
    },

    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: `
Task management information:

Required fields:
- Title
- Description
- Department
- Priority

Allowed departments:
- IT
- HR
- Finance
- Operations

Allowed priorities:
- low
- medium
- high

New task proposals start with:
PENDING_APPROVAL

A pending task is not an approved task.
          `.trim(),
        },
      ],
    })
  );
};
import { z } from "zod";

export const registerTaskPrompts = (server) => {
  server.registerPrompt(
    "draft-task",
    {
      title: "Draft Task",
      description:
        "Generate a clear task description for a company department.",

      argsSchema: {
        title: z.string(),
        department: z.string(),
        issue: z.string(),
      },
    },

    ({ title, department, issue }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `
Prepare a task proposal.

Title: ${title}

Department: ${department}

Issue: ${issue}

Write a clear and concise task description.
Do not claim that the task has been approved or completed.
            `.trim(),
          },
        },
      ],
    })
  );
};
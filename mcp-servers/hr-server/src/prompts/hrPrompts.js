import { z } from "zod";

export const registerHRPrompts = (server) => {
  server.registerPrompt(
    "draft-leave-request",
    {
      title: "Draft Leave Request",
      description:
        "Prepare a clear leave request message.",

      argsSchema: {
        reason: z.string(),
        startDate: z.string(),
        endDate: z.string(),
      },
    },

    ({ reason, startDate, endDate }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `
Prepare a leave request proposal.

Reason: ${reason}

Start date: ${startDate}

End date: ${endDate}

Write a professional request.
Do not claim that the request is approved.
            `.trim(),
          },
        },
      ],
    })
  );
};
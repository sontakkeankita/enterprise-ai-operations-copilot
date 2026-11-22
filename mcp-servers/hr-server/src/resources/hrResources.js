export const registerHRResources = (server) => {
  server.registerResource(
    "hr-request-types",
    "hr://request-types",
    {
      title: "HR Request Types",
      description:
        "Information about the HR request functionality available through this server.",
      mimeType: "text/plain",
    },

    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          text: `
Available HR functionality:

1. Create a leave request proposal.
2. Retrieve current employee profile details.
3. Retrieve a configured leave balance.

New leave requests have the status:
PENDING_APPROVAL

This resource does not define company leave policies,
eligibility rules, or approval requirements.
          `.trim(),
        },
      ],
    })
  );
};
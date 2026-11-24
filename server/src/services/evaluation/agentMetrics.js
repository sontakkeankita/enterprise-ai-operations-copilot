
export const evaluateAgentExecution = ({
  expectedIntent,
  actualIntent,
  expectedTool,
  actualTool,
  toolExecuted,
  toolSucceeded,
}) => {
  const intentCorrect =
    expectedIntent === actualIntent;

  const toolSelectionCorrect =
    expectedTool === actualTool;

  const executionCorrect =
    expectedTool === null
      ? !toolExecuted
      : toolExecuted && toolSucceeded;

  return {
    intentCorrect,
    toolSelectionCorrect,
    executionCorrect,

    passed:
      intentCorrect &&
      toolSelectionCorrect &&
      executionCorrect,
  };
};

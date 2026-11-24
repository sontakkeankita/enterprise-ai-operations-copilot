
export const measureExecutionTime = async (
  operation
) => {
  const start = performance.now();

  try {
    const result = await operation();

    const durationMs = Math.round(
      performance.now() - start
    );

    return {
      result,
      durationMs,
      success: true,
    };
  } catch (error) {
    const durationMs = Math.round(
      performance.now() - start
    );

    return {
      error,
      durationMs,
      success: false,
    };
  }
};

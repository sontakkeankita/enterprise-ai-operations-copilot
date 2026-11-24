
export const calculatePrecisionAtK = (
  retrievedIds,
  relevantIds,
  k = 5
) => {
  const topResults = retrievedIds.slice(0, k);

  if (topResults.length === 0) {
    return 0;
  }

  const relevantSet = new Set(
    relevantIds.map(String)
  );

  const relevantCount = topResults.filter((id) =>
    relevantSet.has(String(id))
  ).length;

  return relevantCount / topResults.length;
};

export const calculateRecallAtK = (
  retrievedIds,
  relevantIds,
  k = 5
) => {
  if (relevantIds.length === 0) {
    return null;
  }

  const topResults = retrievedIds.slice(0, k);

  const relevantSet = new Set(
    relevantIds.map(String)
  );

  const relevantCount = new Set(
    topResults
      .map(String)
      .filter((id) => relevantSet.has(id))
  ).size;

  return relevantCount / relevantSet.size;
};

export const calculateMRR = (
  retrievedIds,
  relevantIds
) => {
  const relevantSet = new Set(
    relevantIds.map(String)
  );

  const rank = retrievedIds.findIndex((id) =>
    relevantSet.has(String(id))
  );

  return rank === -1 ? 0 : 1 / (rank + 1);
};

export const evaluateRetrieval = ({
  retrievedIds,
  relevantIds,
  k = 5,
}) => {
  return {
    precisionAtK: calculatePrecisionAtK(
      retrievedIds,
      relevantIds,
      k
    ),

    recallAtK: calculateRecallAtK(
      retrievedIds,
      relevantIds,
      k
    ),

    meanReciprocalRank: calculateMRR(
      retrievedIds,
      relevantIds
    ),
  };
};

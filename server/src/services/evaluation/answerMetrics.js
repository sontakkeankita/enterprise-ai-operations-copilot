
export const calculateKeywordCoverage = (
  answer,
  expectedKeywords = []
) => {
  if (expectedKeywords.length === 0) {
    return null;
  }

  const normalizedAnswer = answer.toLowerCase();

  const matchedKeywords = expectedKeywords.filter(
    (keyword) =>
      normalizedAnswer.includes(keyword.toLowerCase())
  );

  return {
    score:
      matchedKeywords.length / expectedKeywords.length,

    matchedKeywords,

    missingKeywords: expectedKeywords.filter(
      (keyword) =>
        !normalizedAnswer.includes(keyword.toLowerCase())
    ),
  };
};

export const validateCitations = (
  answer,
  validSourceIds = []
) => {
  const citations = [
    ...answer.matchAll(/\[(S\d+)\]/g),
  ].map((match) => match[1]);

  const validSources = new Set(
    validSourceIds.map(String)
  );

  const invalidCitations = citations.filter(
    (citation) => !validSources.has(citation)
  );

  return {
    citations,
    invalidCitations,
    citationValidity:
      citations.length === 0
        ? null
        : invalidCitations.length === 0,
  };
};

export const evaluateAnswer = ({
  answer,
  expectedKeywords = [],
  validSourceIds = [],
}) => {
  const keywordCoverage = calculateKeywordCoverage(
    answer,
    expectedKeywords
  );

  const citationResults = validateCitations(
    answer,
    validSourceIds
  );

  return {
    hasAnswer: Boolean(answer?.trim()),
    keywordCoverage,
    ...citationResults,
  };
};

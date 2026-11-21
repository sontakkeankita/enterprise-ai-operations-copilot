
import {
  searchSimilarChunks,
} from "../embeddings/vectorSearchService.js";

import {
  searchKeywordChunks,
} from "./keywordSearchService.js";

const RRF_CONSTANT = 60;

const tokenize = (text) => {
  return new Set(
    (text.toLowerCase().match(/[a-z0-9]+/g) || [])
      .filter((word) => word.length > 2)
  );
};

const calculateKeywordOverlap = (question, content) => {
  const queryWords = tokenize(question);
  const contentWords = tokenize(content);

  if (queryWords.size === 0) {
    return 0;
  }

  let matchedWords = 0;

  for (const word of queryWords) {
    if (contentWords.has(word)) {
      matchedWords++;
    }
  }

  return matchedWords / queryWords.size;
};

export const hybridSearch = async (
  question,
  user,
  limit = 5
) => {
  const candidateLimit = Math.min(
    Math.max(limit * 4, 20),
    40
  );

  // Run both retrieval methods concurrently.
  const [semanticResults, keywordResults] =
    await Promise.all([
      searchSimilarChunks(
        question,
        user,
        candidateLimit
      ),
      searchKeywordChunks(
        question,
        user,
        candidateLimit
      ),
    ]);

  const combinedResults = new Map();

  const addResults = (results, searchType) => {
    results.forEach((chunk, index) => {
      const id = String(chunk._id);
      const rank = index + 1;

      if (!combinedResults.has(id)) {
        combinedResults.set(id, {
          ...chunk,
          rrfScore: 0,
          semanticRank: null,
          keywordRank: null,
          semanticScore: null,
          keywordScore: null,
        });
      }

      const existing = combinedResults.get(id);

      existing.rrfScore +=
        1 / (RRF_CONSTANT + rank);

      if (searchType === "semantic") {
        existing.semanticRank = rank;
        existing.semanticScore = chunk.score;
      }

      if (searchType === "keyword") {
        existing.keywordRank = rank;
        existing.keywordScore = chunk.score;
      }
    });
  };

  addResults(semanticResults, "semantic");
  addResults(keywordResults, "keyword");

  const candidates = [...combinedResults.values()];

  if (candidates.length === 0) {
    return [];
  }

  const maxRrf = Math.max(
    ...candidates.map((item) => item.rrfScore)
  );

  // Lightweight baseline reranking.
  const rerankedResults = candidates.map((chunk) => {
    const normalizedRrf =
      chunk.rrfScore / maxRrf;

    const keywordOverlap =
      calculateKeywordOverlap(
        question,
        chunk.content
      );

    const rerankScore =
      0.75 * normalizedRrf +
      0.25 * keywordOverlap;

    return {
      ...chunk,
      keywordOverlap,
      rerankScore,
    };
  });

  rerankedResults.sort(
    (a, b) => b.rerankScore - a.rerankScore
  );

  return rerankedResults.slice(0, limit);
};

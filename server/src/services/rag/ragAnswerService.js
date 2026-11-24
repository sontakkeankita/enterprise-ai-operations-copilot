
import {
  hybridSearch,
} from "./hybridSearchService.js";

import {
  buildCitedContext,
} from "./contextBuilder.js";

import {
  generateRagAnswer,
} from "../llm/geminiService.js";

import {
  measureExecutionTime,
} from "../evaluation/performanceMetrics.js";

import {
  logInfo,
  logError,
} from "../evaluation/logger.js";

const NO_INFORMATION_MESSAGE =
  "I could not find relevant information in the available company documents to answer your question. Please contact the appropriate department for clarification.";

const validateCitations = (answer, sources) => {
  const allowedCitations = new Set(
    sources.map((source) => source.citationId)
  );

  // Remove citation IDs that were not returned by retrieval.
  const safeAnswer = answer.replace(
    /\[(S\d+)\]/g,
    (match, citationId) => {
      return allowedCitations.has(citationId)
        ? match
        : "";
    }
  );

  const citationIds = [
    ...new Set(
      [...safeAnswer.matchAll(/\[(S\d+)\]/g)]
        .map((match) => match[1])
    ),
  ];

  return {
    answer: safeAnswer.trim(),
    citationIds,
  };
};

export const answerWithRag = async ({
  question,
  user,
  limit = 5,
}) => {
  try {
    // Step 1: Retrieve relevant chunks.
    const chunks = await hybridSearch(
      question,
      user,
      limit
    );

    // Step 2: Do not ask Gemini if nothing was retrieved.
    if (!chunks.length) {
      return {
        answer: NO_INFORMATION_MESSAGE,
        sources: [],
        citationIds: [],
        retrieval: {
          method: "hybrid",
          resultCount: 0,
        },
        model: null,
      };
    }

    // Step 3: Build context and source references.
    const {
      context,
      sources,
    } = buildCitedContext(chunks);

    // Step 4: Generate the answer using Gemini
    // and measure execution time.
    const measurement = await measureExecutionTime(
      () =>
        generateRagAnswer({
          question,
          context,
        })
    );

    if (!measurement.success) {
      throw measurement.error;
    }

    const result = measurement.result;

    const durationMs = measurement.durationMs;

    // Step 5: Structured success logging.
    logInfo("RAG answer generated", {
      durationMs,
      model: result.model,
      totalTokens: result.tokenUsage?.totalTokens,
    });

    // Step 6: Validate citation identifiers.
    const validated = validateCitations(
      result.answer,
      sources
    );

    // Step 7: Return the final RAG response.
    return {
      answer: validated.answer,
      sources,
      citationIds: validated.citationIds,
      retrieval: {
        method: "hybrid",
        resultCount: chunks.length,
      },
      model: result.model,
      tokenUsage: result.tokenUsage,
      performance: {
        durationMs,
      },
    };

  } catch (error) {
    // Log failures without exposing document context
    // or credentials.
    logError("RAG answer generation failed", {
      error: error.message,
    });

    throw error;
  }
};

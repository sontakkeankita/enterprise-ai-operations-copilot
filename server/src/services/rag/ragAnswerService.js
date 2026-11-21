
import {
  hybridSearch,
} from "./hybridSearchService.js";

import {
  buildCitedContext,
} from "./contextBuilder.js";

import {
  generateRagAnswer,
} from "../llm/geminiService.js";

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

  // Step 4: Generate the answer using Gemini.
  const generated = await generateRagAnswer({
    question,
    context,
  });

  // Step 5: Validate the citation identifiers.
  const validated = validateCitations(
    generated.answer,
    sources
  );

  return {
    answer: validated.answer,
    sources,
    citationIds: validated.citationIds,
    retrieval: {
      method: "hybrid",
      resultCount: chunks.length,
    },
    model: generated.model,
  };
};

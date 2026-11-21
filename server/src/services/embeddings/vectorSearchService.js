
import DocumentChunk from "../../models/DocumentChunk.js";

import {
  generateEmbeddings,
} from "./embeddingService.js";

import {
  buildVectorAccessFilter,
} from "../rag/accessFilterService.js";

const VECTOR_INDEX_NAME =
  "document_chunks_vector_index";

export const searchSimilarChunks = async (
  question,
  user,
  limit = 5
) => {
  if (
    typeof question !== "string" ||
    !question.trim()
  ) {
    throw new Error("Search question is required");
  }

  const [queryEmbedding] = await generateEmbeddings(
    [question.trim()],
    "RETRIEVAL_QUERY"
  );

  const filter = buildVectorAccessFilter(user);

  const results = await DocumentChunk.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector: queryEmbedding,
        numCandidates: Math.max(limit * 20, 100),
        limit,
        ...(filter ? { filter } : {}),
      },
    },
    {
      $project: {
        content: 1,
        documentId: 1,
        chunkIndex: 1,
        metadata: 1,
        score: {
          $meta: "vectorSearchScore",
        },
      },
    },
  ]);

  return results;
};

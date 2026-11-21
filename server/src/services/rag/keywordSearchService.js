
import DocumentChunk from "../../models/DocumentChunk.js";

import {
  buildAtlasSearchAccessFilter,
} from "./accessFilterService.js";

const TEXT_INDEX_NAME = "document_chunks_text_index";

export const searchKeywordChunks = async (
  question,
  user,
  limit = 20
) => {
  if (
    typeof question !== "string" ||
    !question.trim()
  ) {
    throw new Error("Search question is required");
  }

  const accessFilters =
    buildAtlasSearchAccessFilter(user);

  const compound = {
    must: [
      {
        text: {
          query: question.trim(),
          path: "content",
        },
      },
    ],
  };

  if (accessFilters.length > 0) {
    compound.filter = accessFilters;
  }

  const results = await DocumentChunk.aggregate([
    {
      $search: {
        index: TEXT_INDEX_NAME,
        compound,
      },
    },
    {
      $limit: limit,
    },
    {
      $project: {
        content: 1,
        documentId: 1,
        chunkIndex: 1,
        metadata: 1,
        score: {
          $meta: "searchScore",
        },
      },
    },
  ]);

  return results;
};

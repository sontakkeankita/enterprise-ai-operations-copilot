import {
  hybridSearch as runHybridSearch,
} from "../services/rag/hybridSearchService.js";

import {
  searchKeywordChunks,
} from "../services/rag/keywordSearchService.js";

import {
  buildCitedContext,
} from "../services/rag/contextBuilder.js";

import {
  searchSimilarChunks,
} from "../services/embeddings/vectorSearchService.js";

export const semanticSearch = async (req, res) => {
  try {
    const { question, limit = 5 } = req.body;

    if (
      typeof question !== "string" ||
      !question.trim()
    ) {
      return res.status(400).json({
        message: "Please provide a valid search question",
      });
    }

    const resultLimit = Number(limit);

    if (
      !Number.isInteger(resultLimit) ||
      resultLimit < 1 ||
      resultLimit > 10
    ) {
      return res.status(400).json({
        message: "Limit must be an integer between 1 and 10",
      });
    }

    const results = await searchSimilarChunks(
      question,
      req.user,
      resultLimit
    );

    return res.status(200).json({
      message: "Semantic search completed",
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Semantic search error:", error);

    return res.status(500).json({
      message: "Semantic search failed",
    });
  }
};

export const keywordSearch = async (req, res) => {
  try {
    const { question, limit = 5 } = req.body;

    if (
      typeof question !== "string" ||
      !question.trim()
    ) {
      return res.status(400).json({
        message: "Please provide a valid search question",
      });
    }

    const resultLimit = Number(limit);

    if (
      !Number.isInteger(resultLimit) ||
      resultLimit < 1 ||
      resultLimit > 10
    ) {
      return res.status(400).json({
        message: "Limit must be between 1 and 10",
      });
    }

    const results = await searchKeywordChunks(
      question,
      req.user,
      resultLimit
    );

    return res.status(200).json({
      message: "Keyword search completed",
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("Keyword search error:", error);

    return res.status(500).json({
      message: "Keyword search failed",
    });
  }
};


export const hybridSemanticSearch = async (req, res) => {
  try {
    const { question, limit = 5 } = req.body;

    if (
      typeof question !== "string" ||
      !question.trim()
    ) {
      return res.status(400).json({
        message: "Please provide a valid search question",
      });
    }

    const resultLimit = Number(limit);

    if (
      !Number.isInteger(resultLimit) ||
      resultLimit < 1 ||
      resultLimit > 10
    ) {
      return res.status(400).json({
        message: "Limit must be between 1 and 10",
      });
    }

    const results = await runHybridSearch(
      question,
      req.user,
      resultLimit
    );

    const citedData = buildCitedContext(results);

    return res.status(200).json({
      message: "Hybrid search completed successfully",
      query: question,
      retrievalMethod: "hybrid",
      count: results.length,
      context: citedData.context,
      sources: citedData.sources,
    });
  } catch (error) {
    console.error("Hybrid search error:", error);

    return res.status(500).json({
      message: "Hybrid search failed",
    });
  }
};



import Evaluation from "../../models/Evaluation.js";

import {
  evaluateRetrieval,
} from "./ragMetrics.js";

import {
  evaluateAnswer,
} from "./answerMetrics.js";

import {
  evaluateAgentExecution,
} from "./agentMetrics.js";

export const saveEvaluation = async ({
  evaluationType,
  testCaseId,
  question,
  metrics,
  passed,
  durationMs = null,
  model = null,
  tokenUsage = {},
  error = null,
  createdBy = null,
}) => {
  return Evaluation.create({
    evaluationType,
    testCaseId,
    question,
    metrics,
    passed,
    durationMs,
    model,
    tokenUsage,
    error,
    createdBy,
  });
};

export const runRetrievalEvaluation = async ({
  retrievedIds,
  relevantIds,
  testCaseId,
  question,
  createdBy,
}) => {
  const metrics = evaluateRetrieval({
    retrievedIds,
    relevantIds,
    k: 5,
  });

  const passed =
    metrics.recallAtK !== null &&
    metrics.recallAtK >= 0.7;

  return saveEvaluation({
    evaluationType: "RAG_RETRIEVAL",
    testCaseId,
    question,
    metrics,
    passed,
    createdBy,
  });
};

export const runAnswerEvaluation = async ({
  answer,
  expectedKeywords,
  validSourceIds,
  testCaseId,
  question,
  durationMs,
  model,
  tokenUsage,
  createdBy,
}) => {
  const metrics = evaluateAnswer({
    answer,
    expectedKeywords,
    validSourceIds,
  });

  const keywordScore =
    metrics.keywordCoverage?.score;

  const passed =
    metrics.hasAnswer &&
    metrics.citationValidity !== false &&
    (
      keywordScore === null ||
      keywordScore >= 0.7
    );

  return saveEvaluation({
    evaluationType: "ANSWER_QUALITY",
    testCaseId,
    question,
    metrics,
    passed,
    durationMs,
    model,
    tokenUsage,
    createdBy,
  });
};

export const runAgentEvaluation = async ({
  testCaseId,
  question,
  expectedIntent,
  actualIntent,
  expectedTool,
  actualTool,
  toolExecuted,
  toolSucceeded,
  durationMs,
  createdBy,
}) => {
  const metrics = evaluateAgentExecution({
    expectedIntent,
    actualIntent,
    expectedTool,
    actualTool,
    toolExecuted,
    toolSucceeded,
  });

  return saveEvaluation({
    evaluationType: "AGENT",
    testCaseId,
    question,
    metrics,
    passed: metrics.passed,
    durationMs,
    createdBy,
  });
};

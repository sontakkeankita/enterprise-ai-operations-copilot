
import Document from "../../models/Document.js";
import DocumentChunk from "../../models/DocumentChunk.js";

import {
  generateEmbeddings,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
} from "./embeddingService.js";

const BATCH_SIZE = 50;

export const embedDocumentChunks = async (documentId) => {
  const document = await Document.findById(documentId);

  if (!document) {
    throw new Error("Document not found");
  }

  document.embeddingStatus = "processing";
  document.embeddingModel = EMBEDDING_MODEL;

  await document.save();

  try {
    // Find chunks that have not been embedded yet.
    const chunks = await DocumentChunk.find({
      documentId: document._id,
      $or: [
        { embedding: { $exists: false } },
        { embedding: { $size: 0 } },
      ],
    })
      .sort({ chunkIndex: 1 })
      .select("_id content chunkIndex");

    // Process chunks in batches.
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);

      const texts = batch.map((chunk) => chunk.content);

      const embeddings = await generateEmbeddings(texts);

      const operations = batch.map((chunk, index) => ({
        updateOne: {
          filter: { _id: chunk._id },
          update: {
            $set: {
              embedding: embeddings[index],
              embeddingModel: EMBEDDING_MODEL,
              embeddingDimensions: EMBEDDING_DIMENSIONS,
            },
          },
        },
      }));

      await DocumentChunk.bulkWrite(operations);
    }

    // Count all chunks with embeddings.
    const embeddedChunkCount = await DocumentChunk.countDocuments({
      documentId: document._id,
      embeddingDimensions: EMBEDDING_DIMENSIONS,
      embeddingModel: EMBEDDING_MODEL,
    });

    const totalChunkCount = await DocumentChunk.countDocuments({
      documentId: document._id,
    });

    if (embeddedChunkCount !== totalChunkCount) {
      throw new Error("Some document chunks are missing embeddings");
    }

    document.embeddingStatus = "completed";
    document.embeddedChunkCount = embeddedChunkCount;
    document.embeddingModel = EMBEDDING_MODEL;

    await document.save();

    return {
      totalChunkCount,
      embeddedChunkCount,
      embeddingModel: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
    };
  } catch (error) {
    document.embeddingStatus = "failed";
    await document.save();

    throw error;
  }
};


export const buildCitedContext = (chunks) => {
  const sources = chunks.map((chunk, index) => {
    return {
      citationId: `S${index + 1}`,
      documentId: chunk.documentId,
      chunkIndex: chunk.chunkIndex,
      source:
        chunk.metadata?.source || "Unknown document",
      department:
        chunk.metadata?.department || "Unknown",
      content: chunk.content,
      relevanceScore: Number(
        chunk.rerankScore.toFixed(4)
      ),
    };
  });

  const context = sources
    .map((source) => {
      return [
        `[${source.citationId}]`,
        `Source: ${source.source}`,
        `Department: ${source.department}`,
        `Chunk: ${source.chunkIndex}`,
        source.content,
      ].join("\n");
    })
    .join("\n\n---\n\n");

  return {
    context,
    sources,
  };
};

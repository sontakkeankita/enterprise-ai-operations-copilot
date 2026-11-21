
export const splitIntoChunks = (
  text,
  chunkSize = 1000,
  overlap = 150
) => {
  if (!text || !text.trim()) {
    return [];
  }

  if (overlap >= chunkSize || overlap < 0) {
    throw new Error("Overlap must be smaller than chunk size");
  }

  const chunks = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + chunkSize, text.length);

    // Try to avoid cutting in the middle of a word.
    if (end < text.length) {
      const lastSpace = text.lastIndexOf(" ", end);

      if (lastSpace > start + chunkSize * 0.6) {
        end = lastSpace;
      }
    }

    const content = text.slice(start, end).trim();

    if (content) {
      chunks.push(content);
    }

    if (end >= text.length) {
      break;
    }

    start = end - overlap;
  }

  return chunks;
};

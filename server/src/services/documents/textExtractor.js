
import { PDFParse } from "pdf-parse";

export const extractText = async (file) => {
  if (!file || !file.buffer) {
    throw new Error("No file was provided");
  }

  const extension = file.originalname
    .split(".")
    .pop()
    .toLowerCase();

  // Extract text from PDF
  if (extension === "pdf") {
    const parser = new PDFParse({
      data: file.buffer,
    });

    try {
      const result = await parser.getText();

      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  // Extract text from TXT
  if (extension === "txt") {
    return file.buffer.toString("utf8").trim();
  }

  throw new Error("Only PDF and TXT files are supported");
};


import multer from "multer";
import path from "node:path";

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  const extension = path.extname(file.originalname).toLowerCase();

  const isPdf =
    extension === ".pdf" &&
    file.mimetype === "application/pdf";

  const isTxt =
    extension === ".txt" &&
    file.mimetype === "text/plain";

  if (isPdf || isTxt) {
    return callback(null, true);
  }

  callback(
    new Error("Only PDF and TXT files are allowed")
  );
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
});

export const uploadDocumentFile = upload.single("document");

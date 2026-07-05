import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12 MB

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new ApiError(415, "Unsupported file type. Upload a PNG, JPG, or WEBP image."));
      return;
    }
    cb(null, true);
  },
});

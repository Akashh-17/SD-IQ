import express from "express";
import multer from "multer";
import path from "path";
import { auth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { transcribe } from "../controllers/transcribe.controller.js";
import { UPLOADS_DIR } from "../config/paths.js";

const router = express.Router();

// Whisper detects the format from the extension, so keep it, but
// only from this list (never an arbitrary client-supplied name)
const AUDIO_EXTENSIONS = [".webm", ".wav", ".mp3", ".m4a", ".mp4", ".ogg"];

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(
      null,
      `${Date.now()}-${req.user.id}${AUDIO_EXTENSIONS.includes(ext) ? ext : ".webm"}`
    );
  },
});

const upload = multer({
  storage,
  limits: {
    // Whisper's own limit is 25MB; a spoken answer is far smaller
    fileSize: 10 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("audio/")) {
      return cb(new Error("Only audio files are allowed"));
    }
    cb(null, true);
  },
});

// Turns multer errors (too large, wrong type) into 400s instead of 500s
function uploadAudio(req, res, next) {
  upload.single("audio")(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
    next();
  });
}

router.post(
  "/transcribe",
  auth,
  rateLimit({ name: "transcribe", limit: 20 }),
  uploadAudio,
  transcribe
);

export default router;

import { logError } from "../utils/logger.js";
import fs from "fs";
import { transcribeAudio } from "../services/transcriber.js";
import { log } from "../utils/logger.js";

export async function transcribe(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No audio uploaded",
      });
    }

    const transcript = await transcribeAudio(req.file.path);

    // Sizes only: transcripts are the candidate's answers
    log("TRANSCRIBED", {
      bytes: req.file.size,
      chars: transcript?.length ?? 0,
    });

    fs.unlinkSync(req.file.path);

    return res.json({
      success: true,
      transcript,
    });
  } catch (err) {
    logError(err);

    if (req.file) {
      fs.unlink(req.file.path, () => { });
    }

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
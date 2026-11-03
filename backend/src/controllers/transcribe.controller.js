import fs from "fs";
import { transcribeAudio } from "../services/transcriber.js";

export async function transcribe(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No audio uploaded",
      });
    }

    console.log(req.file);

    const transcript = await transcribeAudio(req.file.path);

    console.log("TRANSCRIPT:", transcript);

    fs.unlinkSync(req.file.path);

    return res.json({
      success: true,
      transcript,
    });
  } catch (err) {
    console.error(err);

    if (req.file) {
      fs.unlink(req.file.path, () => { });
    }

    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
}
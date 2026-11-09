import { MOCK_MODE } from "./mock/mode.js";
import fs from "fs";
import path from "path";
import Groq from "groq-sdk";

const groq = MOCK_MODE ? null : new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function transcribeAudio(filePath) {
  if (MOCK_MODE) return "I would use a load balancer, stateless API servers, a cache and a replicated database.";
  const transcription = await groq.audio.transcriptions.create({
    file: fs.createReadStream(filePath),
    model: "whisper-large-v3-turbo",
    response_format: "json",
    temperature: 0,
    language: "en",
  });

  return transcription.text;
}
import { ChatOpenAI } from "@langchain/openai";
import "../config/env.js";

const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "gpt-4o-mini";
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is required in environment variables");
}

export const llm = new ChatOpenAI({
  model: OPENROUTER_MODEL,
  temperature: 0.3,
  maxTokens: 4096,
  apiKey: OPENROUTER_API_KEY,
  configuration: {
    baseURL: OPENROUTER_BASE_URL,
  },
});
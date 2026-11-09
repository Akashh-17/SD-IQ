import { MOCK_MODE } from "./mock/mode.js";
import { MockLLM } from "./mock/llm.js";
import { ChatOpenAI } from "@langchain/openai";
import "../config/env.js";

// Free default with tool calling and JSON-schema support; environment overrides remain available.
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-super-vl:free";

// Optional cheaper/faster model for the small classification steps
// (intent, conversation style). Defaults to the main model.
const OPENROUTER_FAST_MODEL = process.env.OPENROUTER_FAST_MODEL || OPENROUTER_MODEL;

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// A slow or failed provider call should fail fast and retry,
// not hang the interview turn
const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS) || 30000;
const LLM_MAX_RETRIES = 2;

if (!MOCK_MODE && !OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY is required in environment variables");
}

function createModel(model, maxTokens) {
  if (MOCK_MODE) return new MockLLM();
  return new ChatOpenAI({
    model,
    temperature: 0.3,
    maxTokens,
    timeout: LLM_TIMEOUT_MS,
    maxRetries: LLM_MAX_RETRIES,
    apiKey: OPENROUTER_API_KEY,
    // Keep the free model's reasoning from consuming short classification budgets.
    modelKwargs: model === "nvidia/nemotron-3.5-super-vl:free" ? { reasoning: { enabled: false } } : undefined,
    configuration: {
      baseURL: OPENROUTER_BASE_URL,
    },
  });
}

// Evaluator, interviewer, diagram analysis and report
export const llm = createModel(OPENROUTER_MODEL, 4096);

// Intent classification and conversation style (short outputs)
export const llmFast = createModel(OPENROUTER_FAST_MODEL, 512);

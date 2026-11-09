import pino from "pino";
import { currentRequestId, safeId } from "../observability/context.js";

const sections = new Set([
    "USER", "INTENT", "INTERVIEWER", "REPORT INPUT", "RAW REPORT", "INVALID REPORT JSON",
    "REPORT GENERATED", "GRAPH ANALYSIS", "GRAPH NODE", "DECISION", "CONVERSATION",
    "EVALUATION", "SESSION UPDATE", "ORCHESTRATOR", "NEXT NODE", "TRANSCRIBED"
]);
const labels = new Set([
    "Application event", "Application error", "Request completed", "LangGraph node completed",
    "LLM call failed", "Metrics collection failed", "Interview turn timing", "Server started",
    "Server startup failed", "LangGraph agent initialized", "In-memory Redis initialized",
    "Upstash Redis initialized", "PostgreSQL LangGraph checkpointer initialized"
]);
const numeric = new Set(["durationMs", "totalMs", "timeToFirstTokenMs", "status", "port", "score", "nodes", "edges", "bytes", "chars", "evaluations", "progress", "confidence"]);
const enums = {
    node: ["greeting", "input", "graphAnalyzer", "intent", "orchestrator", "evaluator", "conversationManager", "interviewer"],
    outcome: ["success", "failure", "completed", "error", "disconnected"],
    transport: ["json", "sse"],
    method: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD", "OTHER"],
    model: ["main", "fast"],
    operation: ["invoke", "stream", "structured"],
    intent: ["ANSWER", "QUESTION", "ACKNOWLEDGEMENT", "SMALL_TALK", "CLARIFICATION", "WRAP_UP", "UNKNOWN"],
    event: ["http.request", "graph.node", "llm.error", "metrics.error", "server.start", "server.error"]
};
const secretKey = /authorization|cookie|token|password|secret|api.?key/i;

// Deliberately allow only operational metadata. Prompt text can also appear
// inside errors, graph labels, report feedback and arbitrary nested objects.
export function safeMetadata(data) {
    if (!data || typeof data !== "object") return {};
    const output = {};
    for (const [key, value] of Object.entries(data)) {
        if (numeric.has(key) && (value === null || (typeof value === "number" && Number.isFinite(value)))) { output[key] = value; continue; }
        if (secretKey.test(key)) {
            const field = ["authorization", "Authorization", "cookie", "token", "password", "secret", "apiKey", "api_key"].includes(key) ? key : "sensitive";
            output[field] = "[Redacted]";
            continue;
        }
        if (["headers", "req", "request"].includes(key) && value && typeof value === "object") {
            output[key] = safeMetadata(value); continue;
        }
        if (["requestId", "interviewId"].includes(key) && safeId(value)) output[key] = value;
        else if (enums[key]?.includes(value)) output[key] = value;
        else if (key === "route" && typeof value === "string" && /^(?:unmatched|\/metrics|\/health|\/api\/(?:interview|report|history|problems|voice)(?:\/[a-zA-Z:]+)*\/?)$/.test(value)) output[key] = value;
        else if (key === "section" && (sections.has(value) || labels.has(value))) output[key] = value;
        else if (key === "answeredCurrentQuestion" && typeof value === "boolean") output[key] = value;
        else if (value instanceof Error) output.errorType = ["Error", "TypeError", "RangeError", "AbortError"].includes(value.name) ? value.name : "Error";
    }
    return output;
}

export function createLogger({ destination, pretty = false, level = "info" } = {}) {
    const instance = pino({
        level,
        base: { service: "systemiq-api" },
        mixin: () => ({ requestId: currentRequestId() }),
        redact: { paths: ["authorization", "headers.authorization", "headers.Authorization", "req.headers.authorization", "req.headers.Authorization", "request.headers.authorization"], censor: "[Redacted]" },
        ...(pretty && !destination ? { transport: { target: "pino-pretty", options: { colorize: true, singleLine: true } } } : {})
    }, destination);
    const facade = {};
    for (const level of ["debug", "info", "warn", "error"]) {
        facade[level] = (data = {}, message = "Application event") => {
            instance[level]({ ...safeMetadata(data), requestId: currentRequestId() }, labels.has(message) ? message : "Application event");
        };
    }
    facade.flush = (...args) => instance.flush(...args);
    return facade;
}

export const logger = createLogger({
    level: process.env.LOG_LEVEL ?? (process.env.VITEST ? "silent" : "info"),
    pretty: !["production", "test"].includes(process.env.NODE_ENV) && process.env.LOG_FORMAT !== "json"
});

export function log(section, data = null) {
    logger.info({ section: sections.has(section) ? section : "Application event", ...safeMetadata(data) });
}

export function separator() {
    logger.debug({ section: "Application event" });
}

// Replacements for legacy console calls: free-text errors and provider payloads
// never reach the log sink, even when embedded in an Error.message or stack.
export function logInfo(label, data) {
    logger.info({ section: labels.has(label) ? label : "Application event", ...safeMetadata(data) }, labels.has(label) ? label : "Application event");
}
export function logWarn() { logger.warn({}, "Application event"); }
export function logError(...args) {
    const error = args.find(value => value instanceof Error);
    logger.error(safeMetadata({ err: error }), "Application error");
}

import { Registry, Counter, Histogram, Gauge } from "prom-client";
import { redis } from "../config/redis.js";
import { logger } from "../utils/logger.js";

export const registry = new Registry();
export const httpDuration = new Histogram({
    name: "systemiq_http_request_duration_seconds", help: "HTTP duration including streamed responses",
    labelNames: ["method", "route", "status"], buckets: [0.01, 0.05, 0.1, 0.5, 1, 5, 15, 60, 180], registers: [registry]
});
export const nodeDuration = new Histogram({
    name: "systemiq_langgraph_node_duration_seconds", help: "Time spent in each LangGraph node",
    labelNames: ["node", "outcome"], buckets: [0.001, 0.01, 0.1, 0.5, 1, 5, 15, 60, 180], registers: [registry]
});
export const llmCalls = new Counter({ name: "systemiq_llm_calls_total", help: "Logical LLM calls, excluding nested calls and provider retries", labelNames: ["model", "operation"], registers: [registry] });
export const llmErrors = new Counter({ name: "systemiq_llm_errors_total", help: "Failed or cancelled logical LLM calls", labelNames: ["model", "operation"], registers: [registry] });

for (const model of ["main", "fast"]) {
    for (const operation of ["invoke", "stream", "structured"]) {
        llmCalls.inc({ model, operation }, 0);
        llmErrors.inc({ model, operation }, 0);
    }
}

export async function countActiveInterviews(client = redis) {
    const seen = new Set();
    if (client.entries instanceof Map) {
        // The offline adapter implements the same expiration semantics without SCAN.
        for (const key of client.entries.keys()) {
            if (/^interview:[^:]+$/.test(key) && await client.exists(key)) seen.add(key);
        }
    } else {
        let cursor = "0";
        do {
            const [next, keys] = await client.scan(cursor, { match: "interview:*", count: 1000 });
            cursor = String(next);
            for (const key of keys) if (/^interview:[^:]+$/.test(key)) seen.add(key);
        } while (cursor !== "0");
    }
    return seen.size;
}
export const activeInterviews = new Gauge({
    name: "systemiq_active_interviews", help: "Active Redis interview metadata keys (shared datastore view)", registers: [registry],
    async collect() {
        try { this.set(await countActiveInterviews()); }
        catch {
            this.remove();
            logger.error({ event: "metrics.error" }, "Metrics collection failed");
        }
    }
});

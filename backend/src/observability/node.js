import "./llm.js";
import { performance } from "node:perf_hooks";
import { nodeDuration } from "./metrics.js";
import { logger } from "../utils/logger.js";

export function timeNode(name, node) {
    return async function (state, config) {
        const started = performance.now();
        let outcome = "success";
        try { return await node(state, config); }
        catch (error) { outcome = "failure"; throw error; }
        finally {
            const durationMs = performance.now() - started;
            const interviewId = config?.configurable?.thread_id ?? state?.interview?.interviewId;
            nodeDuration.observe({ node: name, outcome }, durationMs / 1000);
            logger.info({ event: "graph.node", node: name, durationMs: Math.round(durationMs * 1000) / 1000, interviewId, outcome }, "LangGraph node completed");
        }
    };
}

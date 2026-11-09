import { AsyncLocalStorage } from "node:async_hooks";
import { llm, llmFast } from "../services/llm.js";
import { llmCalls, llmErrors } from "./metrics.js";
import { logger } from "../utils/logger.js";

const nested = new AsyncLocalStorage();
const instrumented = new WeakSet();
function failure(labels) {
    llmErrors.inc(labels);
    logger.error({ event: "llm.error", ...labels }, "LLM call failed");
}
export function instrumentModel(model, name) {
    if (instrumented.has(model)) return model;
    instrumented.add(model);
    function wrap(target, operation) {
        if (typeof target.invoke === "function") {
            const invoke = target.invoke;
            target.invoke = function (...args) {
                if (nested.getStore()) return invoke.apply(this, args);
                const labels = { model: name, operation };
                llmCalls.inc(labels);
                return nested.run(true, async () => {
                    try { return await invoke.apply(this, args); }
                    catch (error) { failure(labels); throw error; }
                });
            };
        }
        if (typeof target.stream === "function") {
            const stream = target.stream;
            target.stream = async function* (...args) {
                const outer = !nested.getStore();
                const labels = { model: name, operation: "stream" };
                if (outer) llmCalls.inc(labels);
                let iterator, finished = false;
                try {
                    iterator = (await nested.run(true, () => stream.apply(this, args)))[Symbol.asyncIterator]();
                    while (true) {
                        const result = await nested.run(true, () => iterator.next());
                        if (result.done) { finished = true; break; }
                        yield result.value;
                    }
                } catch (error) {
                    if (outer) failure(labels);
                    finished = true;
                    throw error;
                } finally {
                    try { await nested.run(true, () => iterator?.return?.()); }
                    finally { if (outer && !finished) failure(labels); }
                }
            };
        }
    }
    wrap(model, "invoke");
    if (typeof model.withStructuredOutput === "function") {
        const structured = model.withStructuredOutput;
        model.withStructuredOutput = function (...args) {
            const runnable = structured.apply(this, args);
            wrap(runnable, "structured");
            return runnable;
        };
    }
    return model;
}

// Imported before node modules create their structured-output runnables.
instrumentModel(llm, "main");
instrumentModel(llmFast, "fast");

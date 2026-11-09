import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { redis } from "../../config/redis.js";

import { agent } from "../../controllers/interview.controller.js";
import { SessionService } from "./session.service.js";
import { GraphService } from "../graph/graph.service.js";
import { loadKnowledge } from "../knowledgeLoader.js";
import { analyzeGraph } from "../../nodes/graphNode.js";
import { graphSignature } from "../../utils/graphSignature.js";

// Shared across transports and server instances: a fallback can retrieve a
// completed turn, but must never run a partially processed answer a second time.
async function oncePerTurn(interviewId, message, options, run) {
    if (!options.turnId) return run();
    const key = `turn:${interviewId}:${options.turnId}`;
    const hash = createHash("sha256").update(message).digest("hex");
    const acquired = await redis.set(key, { status: "running", hash }, { nx: true, ex: 86400 });
    if (acquired !== "OK") {
        const deadline = Date.now() + 60000;
        while (Date.now() < deadline) {
            options.signal?.throwIfAborted();
            const saved = await redis.get(key);
            if (!saved || saved.hash !== hash || saved.status === "failed") {
                const error = new Error("This turn was interrupted. Please reload the interview before continuing.");
                error.status = 409;
                throw error;
            }
            if (saved.status === "done") return saved.result;
            await delay(50, undefined, { signal: options.signal });
        }
        throw new Error("The interview turn is still running. Please try again shortly.");
    }
    try {
        const result = await run();
        await redis.set(key, { status: "done", hash, result }, { ex: 86400 });
        return result;
    } catch (error) {
        await redis.set(key, { status: "failed", hash }, { ex: 86400 });
        throw error;
    }
}


export class InterviewService {

    static async initialize(interviewId, interviewState = {}) {

        const config = {
            configurable: {
                thread_id: interviewId
            }
        };

        // Already started: return the last interviewer message instead
        // of running the graph again (which would treat an empty
        // message as a candidate answer).
        const existing = await agent.getState(config);

        if (existing?.values?.interview?.started) {

            return existing.values;

        }

        const session = await SessionService.get(interviewId);

        const knowledge = await loadKnowledge(
            session.interview.problemId, session.interview.userId
        );

        const graph = await GraphService.get(interviewId);

        const result = await agent.invoke(

            {
                knowledge,
                graph,
                interview: interviewState
            },

            config

        );

        const greeting = result.messages?.at(-1)?.content;

        if (greeting) {

            await SessionService.appendTranscript(

                interviewId,

                {
                    role: "assistant",
                    content: greeting
                }

            );

        }

        return result;

    }

    static async sendMessage(interviewId, message, options = {}) {

        return oncePerTurn(interviewId, message, options,
            () => this.runMessage(interviewId, message));

    }

    static async runMessage(interviewId, message) {

        const session = await SessionService.get(interviewId);

        if (!session) {
            throw new Error("Interview session not found.");
        }

        const knowledge = await loadKnowledge(
            session.interview.problemId, session.interview.userId
        );

        const graph = await this.ensureGraphAnalysis(interviewId);

        // Record the candidate's message first so a report generated
        // during this turn includes it.
        if (message) {

            await SessionService.appendTranscript(

                interviewId,

                {
                    role: "user",
                    content: message
                }

            );

        }

        const result = await agent.invoke(

            {
                knowledge,

                candidate: {
                    latestMessage: message
                },

                graph
            },

            {
                configurable: {
                    thread_id: interviewId
                }
            }

        );

        const reply = result.messages?.at(-1)?.content;

        // No-op if the session was closed by report generation
        await SessionService.appendTranscript(

            interviewId,

            {
                role: "assistant",
                content: reply
            }

        );

        return {

            reply,

            completed: Boolean(result.interview?.reportGenerated)

        };

    }

    static async streamMessage(interviewId, message, options = {}) {

        return oncePerTurn(interviewId, message, options, async () => {
            const locked = await SessionService.acquireLock("stream-turn", interviewId, 600);
            if (!locked) {
                const error = new Error("An interview turn is already running.");
                error.status = 409;
                throw error;
            }
            try {
                const { signal, onEvent } = options;
                signal?.throwIfAborted();
                await onEvent("status", { phase: "thinking" });
                const session = await SessionService.get(interviewId);
                if (!session) throw new Error("Interview session not found.");
                const knowledge = await loadKnowledge(session.interview.problemId, session.interview.userId);
                const graph = await this.ensureGraphAnalysis(interviewId);
                signal?.throwIfAborted();

                // Defer transcript writes until generation has finished. Wrap-up
                // invokes this once before report persistence deletes the session.
                let userWrite;
                const saveUser = () => userWrite ??= SessionService.appendTranscript(
                    interviewId, { role: "user", content: message }
                );
                let result;
                const checkpoint = await agent.getState({ configurable: { thread_id: interviewId } });
                try {
                    const stream = await agent.stream(
                        { knowledge, candidate: { latestMessage: message }, graph },
                        {
                            configurable: { thread_id: interviewId, streamInterview: true, beforeReport: saveUser },
                            signal,
                            streamMode: ["updates", "custom"]
                        }
                    );
                    for await (const [mode, update] of stream) {
                        signal?.throwIfAborted();
                        if (mode === "custom") {
                            if (update.type === "interviewer-token") await onEvent("token", { text: update.text });
                            if (update.type === "interviewer-status") await onEvent("status", { phase: update.phase });
                        } else {
                            if (update.intent?.candidate?.intent?.intent === "ANSWER") {
                                await onEvent("status", { phase: "evaluating" });
                            }
                            if (update.interviewer) result = update.interviewer;
                        }
                    }
                    signal?.throwIfAborted();
                    const reply = result?.messages?.at(-1)?.content;
                    if (typeof reply !== "string") throw new Error("The interviewer did not return a reply.");
                    await saveUser();
                    await SessionService.appendTranscript(interviewId, { role: "assistant", content: reply });
                    return { reply, completed: Boolean(result.interview?.reportGenerated) };
                } catch (error) {
                    // Discard partial evaluator/stage checkpoints when no transcript
                    // or report has been committed. Continue from the previous turn.
                    if (!userWrite && checkpoint.values?.interview?.started) {
                        await agent.updateState(checkpoint.config, {}, "interviewer");
                    }
                    throw error;
                }
            } finally {
                await SessionService.releaseLock("stream-turn", interviewId);
            }
        });

    }

    // =====================================================
    // Graph-only analysis
    // Runs only the diagram analysis and stores the result.
    // It does not touch the interview conversation.
    // =====================================================

    static async analyzeGraph(interviewId) {

        await this.ensureGraphAnalysis(interviewId);

    }

    // Returns the current graph with an analysis that matches its
    // structure, running the LLM only if the stored one is stale.
    static async ensureGraphAnalysis(interviewId) {

        const graph = await GraphService.get(interviewId);

        const signature = graphSignature(graph);

        if (
            graph.analysisSignature === signature ||
            !graph.nodes?.length
        ) {

            return graph;

        }

        const analysis = await analyzeGraph(graph);

        // LLM failed: don't cache, retry on the next change or message
        if (!analysis) return graph;

        return await GraphService.setAnalysis(

            interviewId,

            graph,

            analysis,

            signature

        ) ?? graph;

    }

}

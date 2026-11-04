import { agent } from "../../controllers/interview.controller.js";
import { SessionService } from "./session.service.js";
import { GraphService } from "../graph/graph.service.js";
import { loadKnowledge } from "../knowledgeLoader.js";
import { analyzeGraph } from "../../nodes/graphNode.js";
import { graphSignature } from "../../utils/graphSignature.js";

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

        const knowledge = loadKnowledge(
            session.interview.problemId
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

    static async sendMessage(interviewId, message) {

        const session = await SessionService.get(interviewId);

        if (!session) {
            throw new Error("Interview session not found.");
        }

        const knowledge = loadKnowledge(
            session.interview.problemId
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

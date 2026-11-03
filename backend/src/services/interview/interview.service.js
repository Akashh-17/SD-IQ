import { agent } from "../../controllers/interview.controller.js";
import { SessionService } from "./session.service.js";
import { GraphService } from "../graph/graph.service.js";
import { loadKnowledge } from "../knowledgeLoader.js";

export class InterviewService {

    static async initialize(interviewId, interviewState = {}) {

        const session = await SessionService.get(interviewId);

        const knowledge = loadKnowledge(
            session.interview.problemId
        );

        const graph = await GraphService.get(interviewId);

        return await agent.invoke(

            {
                knowledge,
                graph,
                interview: interviewState
            },

            {
                configurable: {
                    thread_id: interviewId
                }
            }

        );

    }

    static async sendMessage(interviewId, message) {

        const session = await SessionService.get(interviewId);

        const knowledge = loadKnowledge(
            session.interview.problemId
        );

        const graph = await GraphService.get(interviewId);

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

        if (message) {

            await SessionService.appendTranscript(

                interviewId,

                {
                    role: "user",
                    content: message
                }

            );

        }

        const reply = result.messages?.at(-1)?.content;

        await SessionService.appendTranscript(

            interviewId,

            {
                role: "assistant",
                content: reply
            }

        );

        return reply;

    }

    static async analyzeGraph(interviewId) {

        const session = await SessionService.get(interviewId);

        const knowledge = loadKnowledge(
            session.interview.problemId
        );

        const graph = await GraphService.get(interviewId);

        await agent.invoke(

            {
                knowledge,
                graph
            },

            {
                configurable: {
                    thread_id: interviewId
                }
            }

        );

    }

}
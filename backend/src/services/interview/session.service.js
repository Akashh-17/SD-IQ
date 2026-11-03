import { redis } from "../../config/redis.js";

const PREFIX = "interview:";

export class SessionService {

    static key(interviewId) {
        return `${PREFIX}${interviewId}`;
    }

    // =====================================================
    // Session
    // =====================================================

    static async create(

        interviewId,

        userId,

        options = {}

    ) {

        const session = {

            interview: {

                interviewId,

                threadId: interviewId,

                userId,

                problemId: options.problemId,

                title:
                    options.title ??
                    "System Design Interview",

                difficulty:
                    options.difficulty ??
                    "SDE1",

                problemDifficulty:
                    options.problemDifficulty ??
                    "Medium",

                status: "ACTIVE",

                startedAt: Date.now()

            },

            transcript: [],

            graph: {

                nodes: [],

                edges: [],

                analysis: null

            },

            report: null,

            metadata: {

                updatedAt: Date.now()

            }

        };

        await redis.set(

            this.key(interviewId),

            session

        );

        return session;

    }

    static async get(interviewId) {

        return await redis.get(

            this.key(interviewId)

        );

    }

    static async save(interviewId, session) {

        if (!session.metadata) {

            session.metadata = {};

        }

        session.metadata.updatedAt = Date.now();

        await redis.set(

            this.key(interviewId),

            session

        );

    }

    static async delete(interviewId) {

        await redis.del(

            this.key(interviewId)

        );

    }

    // =====================================================
    // Transcript
    // =====================================================

    static async appendTranscript(interviewId, message) {

        const session = await this.get(interviewId);

        if (!session) return null;

        session.transcript.push(message);

        await this.save(interviewId, session);

        return session;

    }

    // =====================================================
    // Report
    // =====================================================

    static async saveReport(interviewId, report) {

        const session = await this.get(interviewId);

        if (!session)

            return null;

        session.report = report;

        await this.save(

            interviewId,

            session

        );

        return session;

    }

    static async getReport(interviewId) {

        const session = await this.get(interviewId);

        if (!session)

            return null;

        return session.report;

    }

    // =====================================================
    // Graph
    // =====================================================

    static async updateGraph(interviewId, graph) {

        const session = await this.get(interviewId);

        if (!session) return null;

        session.graph = {

            ...session.graph,

            ...graph

        };

        await this.save(

            interviewId,

            session

        );

        return session;

    }

    static async getGraph(interviewId) {

        const session = await this.get(interviewId);

        return session?.graph ?? null;

    }

}
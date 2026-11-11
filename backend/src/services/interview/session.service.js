import { redis } from "../../config/redis.js";

const PREFIX = "interview:";

// Abandoned interviews expire on their own. Every write
// refreshes the TTL, so an active interview never expires.
export const SESSION_TTL_SECONDS = 24 * 60 * 60;

// =====================================================
// Storage layout (one key per independently-written part,
// so concurrent writers never overwrite each other):
//
//   interview:<id>             interview metadata + report
//   interview:<id>:transcript  Redis list, one message per item (RPUSH)
//   interview:<id>:graph       latest whiteboard { nodes, edges } (what the AI reads)
//   interview:<id>:analysis    { analysis, signature } for that graph
//   interview:<id>:scene       full Excalidraw drawing { elements }, kept apart
//                              so it never enters the agent's state/checkpoints
//
// `get()` assembles them into the same session shape as before, plus `scene`.
// =====================================================

const parse = (value) =>

    typeof value === "string" ? JSON.parse(value) : value;

export class SessionService {

    static key(interviewId) {

        return `${PREFIX}${interviewId}`;

    }

    static keys(interviewId) {

        const base = this.key(interviewId);

        return {

            meta: base,

            transcript: `${base}:transcript`,

            graph: `${base}:graph`,

            analysis: `${base}:analysis`,

            scene: `${base}:scene`

        };

    }

    // =====================================================
    // Session
    // =====================================================

    static async create(

        interviewId,

        userId,

        options = {}

    ) {

        const keys = this.keys(interviewId);

        const meta = {

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

            report: null,

            metadata: {

                updatedAt: Date.now()

            }

        };

        await redis.del(keys.transcript, keys.analysis, keys.scene);

        await redis.set(keys.meta, meta, { ex: SESSION_TTL_SECONDS });

        await redis.set(

            keys.graph,

            { nodes: [], edges: [] },

            { ex: SESSION_TTL_SECONDS }

        );

        return {

            ...meta,

            transcript: [],

            graph: { nodes: [], edges: [], analysis: null }

        };

    }

    static async get(interviewId) {

        const keys = this.keys(interviewId);

        const [meta, transcript, graph, analysis, scene] = await Promise.all([

            redis.get(keys.meta),

            redis.lrange(keys.transcript, 0, -1),

            redis.get(keys.graph),

            redis.get(keys.analysis),

            redis.get(keys.scene)

        ]);

        if (!meta) return null;

        return {

            ...meta,

            transcript: (transcript ?? []).map(parse),

            graph: {

                nodes: graph?.nodes ?? [],

                edges: graph?.edges ?? [],

                analysis: analysis?.analysis ?? null,

                analysisSignature: analysis?.signature ?? null

            },

            scene: scene ?? null

        };

    }

    // Writes interview metadata / report only. Transcript and graph
    // have their own keys and writers, so they're never overwritten here.
    static async save(interviewId, session) {

        const { transcript, graph, ...meta } = session;

        meta.metadata = {

            ...(meta.metadata ?? {}),

            updatedAt: Date.now()

        };

        await redis.set(

            this.key(interviewId),

            meta,

            { ex: SESSION_TTL_SECONDS }

        );

    }

    static async delete(interviewId) {

        const keys = this.keys(interviewId);

        await redis.del(

            keys.meta,

            keys.transcript,

            keys.graph,

            keys.analysis,

            keys.scene

        );

    }

    static async exists(interviewId) {

        return (await redis.exists(this.key(interviewId))) === 1;

    }

    // =====================================================
    // Transcript (atomic append)
    // =====================================================

    static async appendTranscript(interviewId, message) {

        // Closed interviews (report saved, session removed) stay closed
        if (!(await this.exists(interviewId))) return null;

        await redis.rpush(

            this.keys(interviewId).transcript,

            JSON.stringify(message)

        );

        await this.touch(interviewId);

        return message;

    }

    // Refreshes the TTL on every key of an active interview
    static async touch(interviewId) {

        await Promise.all(

            Object.values(this.keys(interviewId)).map(

                key => redis.expire(key, SESSION_TTL_SECONDS)

            )

        );

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

    static async setGraph(interviewId, graph) {

        await redis.set(

            this.keys(interviewId).graph,

            {

                nodes: graph?.nodes ?? [],

                edges: graph?.edges ?? []

            },

            { ex: SESSION_TTL_SECONDS }

        );

        // The full drawing, when sent. A save without one (e.g. a drawing
        // too large to send) keeps the last stored drawing.
        if (graph?.scene) {

            await redis.set(

                this.keys(interviewId).scene,

                graph.scene,

                { ex: SESSION_TTL_SECONDS }

            );

        }

        await this.touch(interviewId);

    }

    static async setGraphAnalysis(interviewId, analysis, signature) {

        await redis.set(

            this.keys(interviewId).analysis,

            { analysis, signature },

            { ex: SESSION_TTL_SECONDS }

        );

    }

    static async getGraph(interviewId) {

        const session = await this.get(interviewId);

        return session?.graph ?? null;

    }

    // =====================================================
    // Short-lived locks (SET NX EX)
    // Returns true if this caller acquired the lock.
    // =====================================================

    static async acquireLock(name, interviewId, ttlSeconds) {

        const result = await redis.set(

            `lock:${name}:${interviewId}`,

            Date.now(),

            { nx: true, ex: ttlSeconds }

        );

        return result === "OK";

    }

    static async releaseLock(name, interviewId) {

        await redis.del(`lock:${name}:${interviewId}`);

    }

}

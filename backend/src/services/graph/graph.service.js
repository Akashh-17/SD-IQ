import { SessionService } from "../interview/session.service.js";

const pendingAnalysis = new Map();

export class GraphService {

    static async update(interviewId, graph) {

        const session = await SessionService.get(interviewId);

        if (!session) return null;

        session.graph = graph;

        session.graphDirty = true;

        await SessionService.save(

            interviewId,

            session

        );

        return session.graph;

    }

    static async get(interviewId) {

        const session = await SessionService.get(interviewId);

        return session?.graph ?? {

            nodes: [],

            edges: []

        };

    }

    static scheduleAnalysis(interviewId, callback) {

        if (pendingAnalysis.has(interviewId)) {

            clearTimeout(

                pendingAnalysis.get(interviewId)

            );

        }

        const timer = setTimeout(async () => {

            pendingAnalysis.delete(interviewId);

            await callback();

        }, 2000);

        pendingAnalysis.set(

            interviewId,

            timer

        );

    }

}
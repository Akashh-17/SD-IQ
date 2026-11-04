import { SessionService } from "../interview/session.service.js";
import { graphSignature } from "../../utils/graphSignature.js";

const pendingAnalysis = new Map();

export class GraphService {

    // Saves the diagram. Returns { graph, changed } where `changed`
    // is true when the structure differs from the last analyzed graph.
    static async update(interviewId, graph) {

        const session = await SessionService.get(interviewId);

        if (!session) return null;

        // Writes only the graph key; the stored analysis (own key)
        // stays valid until the structure changes (checked via signature)
        await SessionService.setGraph(interviewId, graph);

        const saved = {

            nodes: graph?.nodes ?? [],

            edges: graph?.edges ?? [],

            analysis: session.graph.analysis,

            analysisSignature: session.graph.analysisSignature

        };

        return {

            graph: saved,

            changed:
                graphSignature(saved) !==
                saved.analysisSignature

        };

    }

    static async get(interviewId) {

        const session = await SessionService.get(interviewId);

        return session?.graph ?? {

            nodes: [],

            edges: []

        };

    }

    // Stores an analysis together with the signature of the graph
    // it was produced from. Written to its own key, so a diagram
    // save happening at the same time is never overwritten.
    static async setAnalysis(interviewId, graph, analysis, signature) {

        if (!(await SessionService.exists(interviewId))) return null;

        await SessionService.setGraphAnalysis(

            interviewId,

            analysis,

            signature

        );

        return {

            ...graph,

            analysis,

            analysisSignature: signature

        };

    }

    // In-process debounce. With several server instances each one
    // debounces its own requests; the signature check still prevents
    // re-analyzing an unchanged graph.
    static scheduleAnalysis(interviewId, callback) {

        if (pendingAnalysis.has(interviewId)) {

            clearTimeout(

                pendingAnalysis.get(interviewId)

            );

        }

        const timer = setTimeout(async () => {

            pendingAnalysis.delete(interviewId);

            try {

                await callback();

            }

            catch (err) {

                console.error("[Graph Analysis]", err);

            }

        }, 2000);

        pendingAnalysis.set(

            interviewId,

            timer

        );

    }

}

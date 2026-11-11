import axios from "axios";
import { supabase } from "../lib/supabase";
import { API_URL } from "../config";
import type { WhiteboardDocument } from "../components/diagram/useGraphAutosave";

// The backend accepts up to 1MB per request; a very large freehand drawing
// is saved without its full scene rather than not at all (the graph the AI
// reads is always saved).
const MAX_SCENE_CHARS = 900_000;

export async function saveGraph(
    interviewId: string,
    graph: WhiteboardDocument
) {

    const {
        data: { session }
    } = await supabase.auth.getSession();

    const fits = !graph.scene || JSON.stringify(graph.scene).length <= MAX_SCENE_CHARS;

    await axios.post(

        `${API_URL}/api/interview/graph`,

        {
            interviewId,
            graph: fits ? graph : { nodes: graph.nodes, edges: graph.edges }
        },

        {
            headers: {
                Authorization: `Bearer ${session?.access_token}`
            }
        }

    );

}

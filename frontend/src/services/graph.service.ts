import axios from "axios";
import { supabase } from "../lib/supabase";
import { API_URL } from "../config";

export async function saveGraph(
    interviewId: string,
    graph: any
) {

    const {
        data: { session }
    } = await supabase.auth.getSession();

    await axios.post(

        `${API_URL}/api/interview/graph`,

        {
            interviewId,
            graph
        },

        {
            headers: {
                Authorization: `Bearer ${session?.access_token}`
            }
        }

    );

}
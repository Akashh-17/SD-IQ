import { getSession } from "./auth.service";
import { API_URL } from "../config";

export async function getGraphAnalysis(
    interviewId: string
) {

    const session = await getSession();

    const res = await fetch(

        `${API_URL}/api/interview/state/${interviewId}`,

        {

            headers: {

                Authorization:

                    `Bearer ${session?.access_token}`

            }

        }

    );

    if (!res.ok)

        throw new Error("Failed to load graph analysis.");

    const state = await res.json();

    return state.graph?.analysis;

}
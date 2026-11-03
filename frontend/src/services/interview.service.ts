import { getSession } from "./auth.service";
import {API_URL} from "../config";

export async function startInterview(

    problemId: string,

    difficulty: string

) {

    const session = await getSession();

    const res = await fetch(

        `${API_URL}/api/interview/start`,

        {

            method: "POST",

            headers: {

                "Content-Type": "application/json",

                Authorization:

                    `Bearer ${session?.access_token}`

            },

            body: JSON.stringify({

                problemId,

                difficulty

            })

        }

    );

    if (!res.ok)

        throw new Error("Unable to start interview");

    return await res.json();

}
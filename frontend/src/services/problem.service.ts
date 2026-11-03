import { API_URL } from "../config";

export async function getProblems() {

    const res = await fetch(

        `${API_URL}/api/problems`

    );

    return await res.json();

}

export async function getProblem(

    id: string

) {

    const res = await fetch(

        `${API_URL}/api/problems/${id}`

    );

    return await res.json();

}
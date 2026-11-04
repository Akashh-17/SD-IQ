import {API_URL} from "../config";
import { getSession } from "./auth.service";
const API = `${API_URL}/api/voice`;

export async function transcribeAudio(blob: Blob): Promise<string> {
    const form = new FormData();

    form.append("audio", blob, "recording.webm");

    const session = await getSession();

    const res = await fetch(`${API}/transcribe`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${session?.access_token}`,
        },
        body: form,
    });

    if (!res.ok) {
        throw new Error("Transcription failed");
    }

    const json = await res.json();

    return json.transcript;
}

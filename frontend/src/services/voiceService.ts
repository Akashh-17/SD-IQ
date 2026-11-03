import {API_URL} from "../config";
const API = `${API_URL}/api/voice`;

export async function transcribeAudio(blob: Blob): Promise<string> {
    const form = new FormData();

    form.append("audio", blob, "recording.webm");

    const res = await fetch(`${API}/transcribe`, {
        method: "POST",
        body: form,
    });

    if (!res.ok) {
        throw new Error("Transcription failed");
    }

    const json = await res.json();

    console.log(json);

    return json.transcript;
}
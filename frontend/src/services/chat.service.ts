import axios from "axios";
import { supabase } from "../lib/supabase";
import {API_URL} from "../config";

const API = `${API_URL}/api`;

export async function sendInterviewMessage(
    interviewId: string,
    message: string,
    options: { signal?: AbortSignal; turnId?: string } = {}
) {

    const {
        data: { session }
    } = await supabase.auth.getSession();

    const res = await axios.post(

        `${API}/interview/message`,

        {
            interviewId,
            message
        },

        {
            signal: options.signal,
            headers: {
                Authorization: `Bearer ${session?.access_token}`,
                ...(options.turnId ? { "X-Interview-Turn-Id": options.turnId } : {})
            }
        }

    );

    // completed: the interview ended this turn and the report is ready
    return res.data as {
        reply: string;
        completed: boolean;
    };

}
export type InterviewPhase = "thinking" | "evaluating" | "responding";
export type InterviewReply = { reply: string; completed: boolean };
export type StreamOptions = {
    signal?: AbortSignal;
    onToken: (text: string) => void;
    onStatus: (phase: InterviewPhase) => void;
};

export async function streamInterviewMessage(
    interviewId: string,
    message: string,
    options: StreamOptions
): Promise<InterviewReply> {
    const turnId = crypto.randomUUID();
    const { data: { session } } = await supabase.auth.getSession();
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    try {
        const response = await fetch(`${API}/interview/message/stream`, {
            method: "POST", signal: options.signal,
            headers: {
                "Content-Type": "application/json", Accept: "text/event-stream",
                Authorization: `Bearer ${session?.access_token}`,
                "X-Interview-Turn-Id": turnId
            },
            body: JSON.stringify({ interviewId, message })
        });
        if (!response.ok) {
            // Validation, authorization and rate limits must not be retried.
            if ([400, 401, 403, 409, 429].includes(response.status)) {
                throw { isAxiosError: true, response: { status: response.status } };
            }
            throw new Error("Streaming is unavailable");
        }
        if (!response.body || !response.headers.get("content-type")?.includes("text/event-stream")) {
            throw new Error("Streaming is unavailable");
        }
        reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
            const chunk = await reader.read();
            buffer += decoder.decode(chunk.value, { stream: !chunk.done });
            buffer = buffer.replace(/\r\n/g, "\n");
            let end;
            while ((end = buffer.indexOf("\n\n")) !== -1) {
                const frame = buffer.slice(0, end); buffer = buffer.slice(end + 2);
                const lines = frame.split("\n");
                const event = lines.find(line => line.startsWith("event:"))?.slice(6).trim();
                const payload = lines.filter(line => line.startsWith("data:")).map(line => line.slice(5).trimStart()).join("\n");
                if (!event || !payload) continue; // heartbeat/comment
                const data: unknown = JSON.parse(payload);
                if (!data || typeof data !== "object") throw new Error("Invalid stream data");
                if (event === "status" && "phase" in data &&
                    (data.phase === "thinking" || data.phase === "evaluating" || data.phase === "responding")) options.onStatus(data.phase);
                else if (event === "token" && "text" in data && typeof data.text === "string") options.onToken(data.text);
                else if (event === "done" && "reply" in data && typeof data.reply === "string" &&
                    "completed" in data && typeof data.completed === "boolean") return { reply: data.reply, completed: data.completed };
                else if (event === "error") throw new Error("The interview stream was interrupted");
            }
            if (chunk.done) throw new Error("Stream ended before completion");
        }
    } catch (error) {
        if (options.signal?.aborted || axios.isAxiosError(error)) throw error;
        // The shared turn ID retrieves a completed turn or refuses to replay
        // an interrupted run, so fallback never evaluates the same answer twice.
        options.onStatus("thinking");
        return await sendInterviewMessage(interviewId, message, { signal: options.signal, turnId });
    } finally {
        await reader?.cancel().catch(() => {});
    }
}

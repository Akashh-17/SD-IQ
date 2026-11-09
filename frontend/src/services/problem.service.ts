import { API_URL } from "../config";
import { getSession } from "./auth.service";

export class ProblemApiError extends Error {
    status: number;
    code: string;
    suggestion?: string;
    retryAfter?: number;
    constructor(status: number, message: string, code = "", suggestion?: string, retryAfter?: number) {
        super(message);
        this.name = "ProblemApiError";
        this.status = status;
        this.code = code;
        this.suggestion = suggestion;
        this.retryAfter = retryAfter;
    }
}
const object = (value: unknown): Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};

function apiFailure(status: number, payload: unknown, retry: string | null) {
    const data = object(payload);
    const code = typeof data.code === "string" ? data.code : "";
    const suggestion = status === 422 && code === "LOW_LEVEL_DESIGN" && typeof data.suggestion === "string" && data.suggestion.trim().length >= 3 && data.suggestion.trim().length <= 120 ? data.suggestion.trim() : undefined;
    const retryAfter = retry !== null && Number.isFinite(Number(retry)) && Number(retry) > 0 ? Number(retry) : undefined;
    let message = "We couldn’t prepare the interview right now. Please try again.";
    if (status === 401) message = "Your session has expired. Please sign in again.";
    else if (status === 400) message = "Use between 3 and 120 characters for your topic.";
    else if (status === 404) message = "That challenge isn’t available.";
    else if (status === 429) message = "You’ve reached the limit of five topic requests per hour. Please try again later.";
    else if (status === 422) message = code === "LOW_LEVEL_DESIGN" ? "SystemIQ focuses on high-level system design. Try the suggested architecture-level topic." : "Try a software system, service or product that you want to design.";
    else if (code === "INVALID_KNOWLEDGE_PACK") message = "The AI couldn’t prepare a consistent brief. Please try again.";
    else if (code === "CUSTOM_STORAGE_UNAVAILABLE") message = "Your challenge couldn’t be saved or loaded right now. Please try again.";
    return new ProblemApiError(status, message, code, suggestion, retryAfter);
}

async function request(path: string, init: RequestInit = {}, requireAuth = false): Promise<unknown> {
    const session = await getSession();
    if (requireAuth && !session?.access_token) throw new ProblemApiError(401, "Your session has expired. Please sign in again.");
    const headers = { ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}), ...init.headers };
    let response: Response;
    try { response = await fetch(`${API_URL}/api/problems${path}`, { ...init, headers }); }
    catch (error) {
        if (init.signal?.aborted) throw error;
        throw new ProblemApiError(0, "We couldn’t reach the server. Check your connection and try again.");
    }
    let payload: unknown;
    try { payload = await response.json(); }
    catch { throw apiFailure(response.ok ? 502 : response.status, null, null); }
    if (!response.ok) throw apiFailure(response.status, payload, response.headers.get("Retry-After"));
    return payload;
}

export async function getProblems() {
    return request("");
}

export async function getProblem(id: string) {
    return request(`/${encodeURIComponent(id)}`);
}

export async function createCustomProblem(topic: string, signal?: AbortSignal): Promise<{ problem: unknown; matched: boolean }> {
    const payload = object(await request("/custom", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic }), signal
    }, true));
    if (!payload.problem || typeof payload.problem !== "object" || typeof payload.matched !== "boolean") {
        throw new ProblemApiError(502, "The interview brief was incomplete. Please try again.");
    }
    return { problem: payload.problem, matched: payload.matched };
}

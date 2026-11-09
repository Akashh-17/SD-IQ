import { logError, logInfo } from "../utils/logger.js";
import { performance } from "node:perf_hooks";
import { once } from "node:events";
import { InterviewService } from "../services/interview/interview.service.js";

export async function sendMessage(req, res) {

    const started = performance.now();

    try {

        const {

            interviewId,

            message

        } = req.body;

        const {

            reply,

            completed

        } = await InterviewService.sendMessage(

            interviewId,

            message,

            { turnId: turnId(req) }

        );

        res.json({

            reply,

            // true when the interview ended this turn and the
            // report has been generated
            completed

        });

    }

    catch (err) {

        logError(err);

        res.status(err.status ?? 500).json({

            message: err.message

        });

    } finally {
        logInfo("Interview turn timing", { transport: "json", timeToFirstTokenMs: null, totalMs: Math.round(performance.now() - started) });
    }

}
function turnId(req) {
    const id = req.get("X-Interview-Turn-Id");
    if (id && !/^[a-zA-Z0-9-]{1,64}$/.test(id)) {
        const error = new Error("Invalid turn ID");
        error.status = 400;
        throw error;
    }
    return id;
}

export async function streamMessage(req, res) {
    let id;
    try { id = turnId(req); } catch (error) { return res.status(400).json({ message: error.message }); }
    const started = performance.now();
    let firstToken, outcome = "completed";
    const abort = new AbortController();
    const disconnect = () => { if (!res.writableEnded) abort.abort(); };
    res.on("close", disconnect);
    res.status(200).set({
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
    });
    res.flushHeaders();
    const heartbeat = setInterval(() => { if (!res.destroyed) res.write(": keepalive\n\n"); }, 15000);
    heartbeat.unref();
    const emit = async (event, data) => {
        abort.signal.throwIfAborted();
        if (event === "token" && firstToken === undefined) firstToken = performance.now() - started;
        if (!res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)) {
            await once(res, "drain", { signal: abort.signal });
        }
    };
    try {
        const result = await InterviewService.streamMessage(req.body.interviewId, req.body.message, {
            turnId: id, signal: abort.signal, onEvent: emit
        });
        await emit("done", result);
    } catch (error) {
        outcome = abort.signal.aborted ? "disconnected" : "error";
        if (!abort.signal.aborted && !res.destroyed) {
            await emit("error", { message: "The interview stream was interrupted. Please try again." }).catch(() => {});
        }
    } finally {
        clearInterval(heartbeat);
        res.off("close", disconnect);
        if (!res.destroyed) res.end();
        logInfo("Interview turn timing", {
            transport: "sse", outcome,
            timeToFirstTokenMs: firstToken === undefined ? null : Math.round(firstToken),
            totalMs: Math.round(performance.now() - started)
        });
    }
}

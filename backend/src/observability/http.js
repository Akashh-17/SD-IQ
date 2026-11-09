import { timingSafeEqual } from "node:crypto";
import { performance } from "node:perf_hooks";
import { httpDuration, registry } from "./metrics.js";
import { logger } from "../utils/logger.js";
import { requestContext } from "./context.js";

function routeLabel(req) {
    // Route templates only: never put raw URLs, query strings or IDs in labels.
    return req.route ? `${req.baseUrl ?? ""}${req.route.path}` : "unmatched";
}
export function observeHttp(req, res, next) {
    const started = performance.now();
    const context = requestContext.getStore();
    let recorded = false;
    const record = () => {
        if (recorded) return;
        recorded = true;
        const durationMs = performance.now() - started;
        const status = res.writableFinished ? res.statusCode : 499;
        const method = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"].includes(req.method) ? req.method : "OTHER";
        const route = routeLabel(req);
        httpDuration.observe({ method, route, status: String(status) }, durationMs / 1000);
        requestContext.run(context, () => logger.info({ event: "http.request", method, route, status, durationMs }, "Request completed"));
    };
    res.once("finish", record);
    res.once("close", record);
    next();
}

export async function metricsEndpoint(req, res) {
    const token = process.env.METRICS_TOKEN;
    if (token) {
        const expected = Buffer.from(`Bearer ${token}`);
        const supplied = Buffer.from(req.headers.authorization ?? "");
        if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
            return res.status(401).json({ message: "Unauthorized" });
        }
    }
    try {
        res.type(registry.contentType).send(await registry.metrics());
    } catch {
        logger.error({ event: "metrics.error" }, "Metrics collection failed");
        res.status(503).json({ message: "Metrics unavailable" });
    }
}

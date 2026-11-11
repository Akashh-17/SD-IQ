import "./src/config/env.js";
import express from "express";
import { pathToFileURL } from "node:url";
import { requestId } from "./src/middleware/requestId.js";
import { observeHttp, metricsEndpoint } from "./src/observability/http.js";
import { logger } from "./src/utils/logger.js";
import cors from "cors";
import reportRoutes from "./src/routes/report.routes.js";
import interviewRoutes from "./src/routes/interview.routes.js";
import historyRoutes from "./src/routes/history.routes.js";
import problemRoutes from "./src/routes/problem.routes.js";
import voiceRoutes from "./src/routes/voice.routes.js";
import healthRoutes from "./src/routes/health.routes.js";
import { initializeAgent } from "./src/controllers/interview.controller.js";

export const app = express();
app.use(requestId);
app.use(observeHttp);
// Comma-separated list, e.g.
// CORS_ORIGINS=http://localhost:5173,https://my-app.vercel.app
const corsOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  exposedHeaders: ["X-Request-Id"]
}));
// 1MB: room for a full whiteboard drawing (Upstash also caps requests at 1MB)
app.use(express.json({ limit: "1mb" }));
app.get("/metrics", metricsEndpoint);
app.use("/health", healthRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/problems", problemRoutes);


// Keep parser/framework failures out of Express's raw stderr logger.
app.use((error, _req, res, _next) => {
    const status = Number.isInteger(error.status) && error.status >= 400 && error.status <= 599 ? error.status : 500;
    logger.error({ status, err: error }, "Application error");
    if (res.headersSent) return res.destroy();
    res.status(status).json({ message: status === 400 ? "Invalid request" : "Internal server error" });
});

const PORT = process.env.PORT || 5000;

export async function startServer() {
    try {
        await initializeAgent();

        return app.listen(PORT, () => {
            logger.info({ event: "server.start", port: Number(PORT) }, "Server started");
        });
    } catch (error) {
        logger.error({ event: "server.error", err: error }, "Server startup failed");
        process.exit(1);
    }
}

if (process.argv[1] && (import.meta.url === pathToFileURL(process.argv[1]).href || process.argv[1].replaceAll("\\", "/").endsWith("/services/mock/dev.js"))) {
    startServer();
}
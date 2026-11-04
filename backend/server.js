import "./src/config/env.js";
import express from "express";
import cors from "cors";
import reportRoutes from "./src/routes/report.routes.js";
import interviewRoutes from "./src/routes/interview.routes.js";
import historyRoutes from "./src/routes/history.routes.js";
import problemRoutes from "./src/routes/problem.routes.js";
import voiceRoutes from "./src/routes/voice.routes.js";
import { initializeAgent } from "./src/controllers/interview.controller.js";

const app = express();
// Comma-separated list, e.g.
// CORS_ORIGINS=http://localhost:5173,https://my-app.vercel.app
const corsOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json());
app.use("/api/voice", voiceRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/problems", problemRoutes);

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await initializeAgent();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
}

startServer();
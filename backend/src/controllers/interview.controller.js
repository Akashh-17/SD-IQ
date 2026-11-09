import { logInfo } from "../utils/logger.js";
import { buildAgent } from "../../agent.js";
import { initializeCheckpointer } from "../services/memory.js";

export let agent = null;

export async function initializeAgent() {
    const checkpointer = await initializeCheckpointer();
    agent = buildAgent(checkpointer);

    logInfo("LangGraph agent initialized");
}

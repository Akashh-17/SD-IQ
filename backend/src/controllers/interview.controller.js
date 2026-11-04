import { buildAgent } from "../../agent.js";
import { initializeCheckpointer } from "../services/memory.js";

export let agent = null;

export async function initializeAgent() {
    const checkpointer = await initializeCheckpointer();
    agent = buildAgent(checkpointer);

    console.log("LangGraph agent initialized");
}

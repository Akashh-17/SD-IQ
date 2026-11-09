import { logInfo } from "../utils/logger.js";

import { MOCK_MODE } from "./mock/mode.js";
import { MemorySaver } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

let checkpointer;

export async function initializeCheckpointer() {
    if (checkpointer) return checkpointer;

    if (MOCK_MODE) return (checkpointer = new MemorySaver());

    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not configured");
    }

    checkpointer = PostgresSaver.fromConnString(
        process.env.DATABASE_URL
    );

    await checkpointer.setup();

    logInfo("PostgreSQL LangGraph checkpointer initialized");

    return checkpointer;
}

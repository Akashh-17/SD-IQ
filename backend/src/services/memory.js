
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";

let checkpointer;

export async function initializeCheckpointer() {
    if (checkpointer) return checkpointer;

    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL is not configured");
    }

    checkpointer = PostgresSaver.fromConnString(
        process.env.DATABASE_URL
    );

    await checkpointer.setup();

    console.log("PostgreSQL LangGraph checkpointer initialized");

    return checkpointer;
}

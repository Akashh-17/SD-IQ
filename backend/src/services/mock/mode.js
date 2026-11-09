import "../../config/env.js";

export const MOCK_MODE = process.env.MOCK_MODE === "true";

if (MOCK_MODE && process.env.NODE_ENV === "production") {
    throw new Error("MOCK_MODE must never run in production");
}

// The legacy logger records full prompts; never enable it for offline demos.
if (MOCK_MODE) process.env.LOG_TO_FILE = "false";

process.env.MOCK_MODE = "true";
process.env.LOG_TO_FILE = "false";
await import("../../../server.js");

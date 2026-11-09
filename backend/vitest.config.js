import { defineConfig } from "vitest/config";
export default defineConfig({ test: { env: { MOCK_MODE: "true", NODE_ENV: "test", LOG_TO_FILE: "false" }, testTimeout: 20000 } });

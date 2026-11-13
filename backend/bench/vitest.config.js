import { defineConfig } from "vitest/config";

// Separate config so measurements never run as part of `npm test`.
export default defineConfig({
    test: {
        include: ["**/*.measure.js"],
        env: { MOCK_MODE: "true", NODE_ENV: "test", LOG_TO_FILE: "false" },
        testTimeout: 600000
    }
});

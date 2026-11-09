// This backend ships plain ESM JavaScript; validate every source file without
// importing it or requiring service credentials. There is no compilation step.
import { readdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
function files(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const file = join(directory, entry.name);
        return entry.isDirectory() ? files(file) : file.endsWith(".js") ? [file] : [];
    });
}
const sources = [join(root, "server.js"), join(root, "agent.js"), ...files(join(root, "src")), ...files(join(root, "test")), join(root, "vitest.config.js")];
for (const file of sources) {
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status !== 0) { console.error(result.stderr || result.error); process.exit(1); }
}
console.log(`JavaScript syntax: ${sources.length} files passed`);

import { it, expect } from "vitest";
import { spawn, spawnSync } from "node:child_process";
import { cp, mkdtemp, symlink, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";

it("npm run dev boots without env files or credentials and health returns 200", async () => {
    const root = path.resolve(import.meta.dirname, "..");
    const temp = await mkdtemp(path.join(tmpdir(), "systemiq-offline-"));
    const listener = net.createServer();
    await new Promise(resolve => listener.listen(0, "127.0.0.1", resolve));
    const port = listener.address().port;
    await new Promise(resolve => listener.close(resolve));
    let child, logs = "";
    try {
        for (const item of ["src", "server.js", "agent.js", "package.json"]) await cp(path.join(root, item), path.join(temp, item), { recursive: true });
        await symlink(path.join(root, "node_modules"), path.join(temp, "node_modules"), process.platform === "win32" ? "junction" : "dir");
        const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => /^(path|pathext|systemroot|windir|temp|tmp|home|userprofile|appdata|localappdata)$/i.test(key)));
        Object.assign(env, { MOCK_MODE: "true", NODE_ENV: "test", LOG_TO_FILE: "false", PORT: String(port) });
        child = process.platform === "win32" ? spawn("cmd.exe", ["/d", "/s", "/c", "npm run dev"], { cwd: temp, env, windowsHide: true }) : spawn("npm", ["run", "dev"], { cwd: temp, env });
        child.stdout.on("data", chunk => { logs += chunk; }); child.stderr.on("data", chunk => { logs += chunk; });
        let result;
        const deadline = Date.now() + 15000;
        while (Date.now() < deadline) {
            try { result = await fetch(`http://127.0.0.1:${port}/health`); break; } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
        }
        expect(result, logs).toBeDefined(); expect(result.status, logs).toBe(200);
        const health = await result.json(); expect(health.status).toBe("ok");
        expect(health.checks.redis.ok).toBe(true); expect(health.checks.postgres.ok).toBe(true);
        expect(logs).toContain("LangGraph agent initialized");
        console.log("MOCK_MODE=true npm run dev: no env files or credentials; GET /health -> 200 (Redis and checkpointer in memory)");
    } finally {
        if (child) {
            if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true });
            else child.kill();
            if (child.exitCode === null) await new Promise(resolve => { child.once("exit", resolve); setTimeout(resolve, 2000); });
        }
        // Resolve and constrain cleanup to this uniquely-created temporary test folder.
        if (path.resolve(temp).startsWith(path.join(path.resolve(tmpdir()), "systemiq-offline-"))) await rm(temp, { recursive: true, force: true, maxRetries: 3 });
    }
}, 25000);

import { MOCK_MODE } from "../services/mock/mode.js";
import { Router } from "express";
import pg from "pg";
import { redis } from "../config/redis.js";

const router = Router();

// One small pool just for health checks, created on first use
let pool;

function getPool() {

    pool ??= new pg.Pool({

        connectionString: process.env.DATABASE_URL,

        max: 1

    });

    return pool;

}

// Gives up on a dependency after `ms`, so the health check
// itself never hangs
function withTimeout(promise, ms = 3000) {

    return Promise.race([

        promise,

        new Promise((_, reject) =>

            setTimeout(() => reject(new Error("timeout")), ms)

        )

    ]);

}

async function check(fn) {

    const started = Date.now();

    try {

        await withTimeout(fn());

        return { ok: true, latencyMs: Date.now() - started };

    }

    catch (err) {

        return { ok: false, error: err.message };

    }

}

// =====================================================
// GET /health
// 200 when Redis and Postgres both respond, 503 otherwise.
// Point the hosting provider's health check here.
// =====================================================

router.get("/", async (_, res) => {

    const [redisStatus, postgresStatus] = await Promise.all([

        check(() => redis.ping()),

        check(() => MOCK_MODE ? Promise.resolve() : getPool().query("SELECT 1"))

    ]);

    const ok = redisStatus.ok && postgresStatus.ok;

    res.status(ok ? 200 : 503).json({

        status: ok ? "ok" : "degraded",

        uptimeSeconds: Math.round(process.uptime()),

        checks: {

            redis: redisStatus,

            postgres: postgresStatus

        }

    });

});

export default router;

import { redis } from "../config/redis.js";

// =====================================================
// Fixed-window rate limiter backed by Upstash Redis
// Counters live in Redis, so limits hold across multiple
// server instances. Keyed by user (after `auth`) or IP.
// =====================================================

export function rateLimit({ name, limit, windowSeconds = 60 }) {

    return async (req, res, next) => {

        const who = req.user?.id ?? req.ip;

        const window = Math.floor(Date.now() / 1000 / windowSeconds);

        const key = `ratelimit:${name}:${who}:${window}`;

        try {

            const count = await redis.incr(key);

            if (count === 1) {

                await redis.expire(key, windowSeconds);

            }

            res.setHeader("X-RateLimit-Limit", limit);

            res.setHeader(
                "X-RateLimit-Remaining",
                Math.max(0, limit - count)
            );

            if (count > limit) {

                res.setHeader("Retry-After", windowSeconds);

                return res.status(429).json({

                    message: "Too many requests. Please slow down."

                });

            }

        }

        catch (err) {

            // Fail open: a Redis outage shouldn't take the API down
            console.error("[Rate Limit]", err.message);

        }

        next();

    };

}

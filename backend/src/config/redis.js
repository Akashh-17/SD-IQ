import { logInfo } from "../utils/logger.js";
import { MOCK_MODE } from "../services/mock/mode.js";
import { MemoryRedis } from "../services/mock/redis.js";
import { Redis } from "@upstash/redis";
import "./env.js";


export const redis = MOCK_MODE ? new MemoryRedis() : new Redis({

    url: process.env.UPSTASH_REDIS_REST_URL,

    token: process.env.UPSTASH_REDIS_REST_TOKEN,

});

logInfo(MOCK_MODE ? "In-memory Redis initialized" : "Upstash Redis initialized");
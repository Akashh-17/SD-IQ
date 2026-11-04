import { Redis } from "@upstash/redis";
import "./env.js";


export const redis = new Redis({

    url: process.env.UPSTASH_REDIS_REST_URL,

    token: process.env.UPSTASH_REDIS_REST_TOKEN,

});

console.log("✅ Upstash Redis Initialized");
import { nodeFor } from "./nodeFactory";

export const RedisCacheNode = nodeFor("redis");
export const MemCacheNode = nodeFor("memcache");
export const LocalCacheNode = nodeFor("localcache");

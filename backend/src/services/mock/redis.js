// Values are cloned like a remote store; expiry is lazy and clock based.
export class MemoryRedis {
    entries = new Map();

    entry(key) {
        const entry = this.entries.get(key);
        if (entry?.expiresAt <= Date.now()) {
            this.entries.delete(key);
            return undefined;
        }
        return entry;
    }

    async get(key) { return structuredClone(this.entry(key)?.value ?? null); }
    async set(key, value, options = {}) {
        if (options.nx && this.entry(key)) return null;
        this.entries.set(key, {
            value: structuredClone(value),
            expiresAt: options.ex == null ? Infinity : Date.now() + options.ex * 1000
        });
        return "OK";
    }
    async del(...keys) { return keys.flat().reduce((n, key) => n + Number(this.entries.delete(key)), 0); }
    async exists(key) { return Number(Boolean(this.entry(key))); }
    async rpush(key, ...values) {
        const entry = this.entry(key) ?? { value: [], expiresAt: Infinity };
        entry.value.push(...structuredClone(values));
        this.entries.set(key, entry);
        return entry.value.length;
    }
    async lrange(key, start, stop) {
        const list = this.entry(key)?.value ?? [];
        const from = start < 0 ? Math.max(list.length + start, 0) : start;
        const end = Math.min(stop < 0 ? list.length + stop : stop, list.length - 1);
        return end < from ? [] : structuredClone(list.slice(from, end + 1));
    }
    async expire(key, seconds) {
        const entry = this.entry(key);
        if (!entry) return 0;
        entry.expiresAt = Date.now() + seconds * 1000;
        return 1;
    }
    async incr(key) {
        const entry = this.entry(key) ?? { value: 0, expiresAt: Infinity };
        entry.value = Number(entry.value) + 1;
        this.entries.set(key, entry);
        return entry.value;
    }
    async ping() { return "PONG"; }
    reset() { this.entries.clear(); }
}

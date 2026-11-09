import { randomUUID } from "node:crypto";

// A thenable query builder, matching the subset used by the application.
export class MemorySupabase {
    tables = { interviews: [], reports: [], graphs: [], custom_problems: [] };
    auth = {
        getUser: async token => {
            const id = /^mock-token-(.+)$/.exec(token ?? "")?.[1];
            return { data: { user: id ? { id, email: `${id}@example.test` } : null }, error: id ? null : { message: "Invalid mock token" } };
        }
    };
    reset() { for (const rows of Object.values(this.tables)) rows.length = 0; }
    from(table) {
        if (!Object.hasOwn(this.tables, table)) throw new Error(`Unsupported mock table: ${table}`);
        const filters = [];
        let operation = "select", payload, conflict = "id", cardinality, ordering, promise;
        const query = {
            select: () => query,
            eq: (key, value) => { filters.push(row => row[key] === value); return query; },
            in: (key, values) => { filters.push(row => values.includes(row[key])); return query; },
            order: (key, options = {}) => { ordering = { key, ascending: options.ascending !== false }; return query; },
            insert: rows => { operation = "insert"; payload = rows; return query; },
            upsert: (rows, options = {}) => { operation = "upsert"; payload = rows; conflict = options.onConflict ?? "id"; return query; },
            delete: () => { operation = "delete"; return query; },
            single: () => { cardinality = "single"; return query; },
            maybeSingle: () => { cardinality = "maybe"; return query; },
            then: (resolve, reject) => {
                promise ??= Promise.resolve().then(() => {
                    let rows = this.tables[table];
                    let result;
                    if (operation === "insert" || operation === "upsert") {
                        result = (Array.isArray(payload) ? payload : [payload]).map(input => {
                            const old = operation === "upsert" && rows.find(row => row[conflict] === input[conflict]);
                            if (old) { Object.assign(old, structuredClone(input)); return old; }
                            const row = { id: randomUUID(), created_at: new Date().toISOString(), started_at: new Date().toISOString(), ...structuredClone(input) };
                            rows.push(row);
                            return row;
                        });
                    } else {
                        result = rows.filter(row => filters.every(filter => filter(row)));
                        if (operation === "delete") this.tables[table] = rows.filter(row => !result.includes(row));
                    }
                    if (ordering) result = [...result].sort((a,b) => String(a[ordering.key]).localeCompare(String(b[ordering.key])) * (ordering.ascending ? 1 : -1));
                    if (cardinality && (result.length > 1 || (cardinality === "single" && result.length !== 1))) {
                        return { data: null, error: { message: "Unexpected number of rows", code: "PGRST116" } };
                    }
                    return { data: structuredClone(cardinality ? result[0] ?? null : result), error: null };
                });
                return promise.then(resolve, reject);
            }
        };
        return query;
    }
}

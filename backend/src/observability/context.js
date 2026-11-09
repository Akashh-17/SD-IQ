import { AsyncLocalStorage } from "node:async_hooks";

export const requestContext = new AsyncLocalStorage();
export const currentRequestId = () => requestContext.getStore()?.requestId ?? "background";

export function safeId(value) {
    return typeof value === "string" && /^[a-zA-Z0-9_.:-]{1,128}$/.test(value) &&
        !/sk-or-|sk-|gsk_|eyJ|bearer|secret|password/i.test(value);
}

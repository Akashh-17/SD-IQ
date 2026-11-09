import { describe, it, expect } from "vitest";
import { describeApiError, errorStatus } from "./apiError";
const failure = (status: number) => ({ isAxiosError: true, response: { status } });
describe("API error messages", () => {
    it.each([[400, "4,000"], [401, "expired"], [404, "no longer active"], [429, "too quickly"], [500, "hit a problem"]])("maps status %s", (status, text) => {
        expect(errorStatus(failure(Number(status)))).toBe(status);
        expect(describeApiError(failure(Number(status)))).toContain(text);
    });
    it("handles a connection error", () => { expect(errorStatus(new Error())).toBeUndefined(); expect(describeApiError(new Error())).toContain("Can't reach the server"); });
});

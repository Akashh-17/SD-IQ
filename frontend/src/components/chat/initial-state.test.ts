// @vitest-environment node
import { expect, it, vi } from "vitest";
import { sharedInitial } from "./room.context";
it("shares concurrent and later initial reads within one room", async () => {
    const state = { stage: "Requirements" };
    let finish!: (value: typeof state) => void;
    const fetch = vi.fn(() => new Promise<typeof state>(resolve => { finish = resolve; }));
    const read = sharedInitial(fetch);
    const header = read(), chat = read();
    expect(header).toBe(chat); expect(fetch).toHaveBeenCalledTimes(1);
    finish(state);
    expect(await chat).toBe(state);
    expect(await read()).toBe(state); expect(fetch).toHaveBeenCalledTimes(1);
    const anotherRoom = sharedInitial(fetch); anotherRoom();
    expect(fetch).toHaveBeenCalledTimes(2);
});
it("clears a failed initial read so the diagram's retry can recover", async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ stage: "Scaling" });
    const read = sharedInitial(fetch);
    const failed = await Promise.allSettled([read(), read()]);
    expect(failed.every(result => result.status === "rejected")).toBe(true);
    expect(await read()).toEqual({ stage: "Scaling" });
    expect(fetch).toHaveBeenCalledTimes(2);
});

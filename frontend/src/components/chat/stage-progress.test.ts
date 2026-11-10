import { describe, expect, it } from "vitest";
import { completedStepIndexes } from "./room.context";

describe("completedStepIndexes", () => {
    it("checks off every earlier step during a normal interview", () => {
        expect(completedStepIndexes("Scaling")).toEqual([0, 1, 2]);
        expect(completedStepIndexes("Requirements")).toEqual([]);
    });

    it("does not check off stages skipped by an early wrap-up", () => {
        expect(completedStepIndexes("Wrap-up", "High Level Design")).toEqual([0, 1]);
        expect(completedStepIndexes("Wrap-up", "Requirements")).toEqual([0]);
    });

    it("never marks the active step itself as completed", () => {
        expect(completedStepIndexes("Wrap-up", "Tradeoffs")).toEqual([0, 1, 2, 3]);
    });

    it("returns nothing for an unknown stage", () => {
        expect(completedStepIndexes(undefined)).toEqual([]);
        expect(completedStepIndexes("Wrap-up", "Unknown stage")).toEqual([]);
    });
});

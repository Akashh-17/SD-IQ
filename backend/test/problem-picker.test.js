import { expect, it } from "vitest";
import request from "supertest";
import express from "express";
import problemRoutes from "../src/routes/problem.routes.js";
import { ProblemService } from "../src/services/problem/problem.service.js";
import { loadKnowledge } from "../src/services/knowledgeLoader.js";

const app = express();
app.use("/api/problems", problemRoutes);

it("exposes duration, supported levels and concepts from each problem's knowledge files", async () => {
    const problems = await ProblemService.getAll();
    expect(problems.length).toBeGreaterThan(0);
    for (const problem of problems) {
        const source = loadKnowledge(problem.id);
        expect(problem.estimatedDuration).toBe(source.interview.estimatedDuration);
        expect(problem.difficultyLevels).toEqual(source.interview.difficultyLevels);
        expect(problem.concepts.length).toBeGreaterThan(0);
        const concepts = source.interview.stages.flatMap(stage => stage.completionCriteria.flatMap(criterion => criterion.concepts));
        expect(problem.concepts.every(concept => concepts.includes(concept))).toBe(true);
        expect(new Set(problem.concepts).size).toBe(problem.concepts.length);
        expect(problem).not.toHaveProperty("stages");
        expect(problem).not.toHaveProperty("evaluation");
        expect(problem).not.toHaveProperty("architecture");
    }
});
it("serves the same brief and metadata from list and detail endpoints", async () => {
    const list = await request(app).get("/api/problems");
    expect(list.status).toBe(200);
    const first = list.body[0];
    const detail = await request(app).get(`/api/problems/${first.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body).toEqual(first);
    expect(detail.body.functionalRequirements.length).toBeGreaterThan(0);
    expect(detail.body.nonFunctionalRequirements.length).toBeGreaterThan(0);
    expect(detail.body.constraints.length).toBeGreaterThan(0);
});
it("keeps missing and invalid problem IDs rejected", async () => {
    expect((await request(app).get("/api/problems/missing_problem")).status).toBe(404);
    await expect(ProblemService.get("../secret")).rejects.toMatchObject({ code: "ENOENT" });
});

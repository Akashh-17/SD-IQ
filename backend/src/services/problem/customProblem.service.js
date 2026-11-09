import { randomBytes } from "node:crypto";
import { supabase } from "../../config/supabase.js";
import { KnowledgeBundleSchema } from "../../knowledge/schema.js";
import { classifyTopic, generateProblem } from "../../agents/problemGenerator/agent.js";

export const CUSTOM_PROBLEM_ID = /^custom_[0-9a-f]{32}$/;

const missing = () => Object.assign(new Error("Problem not found"), { status: 404, code: "ENOENT" });
const storageFailure = () => Object.assign(new Error("We couldn’t save or load your custom challenge. Please try again."), { status: 503, code: "CUSTOM_STORAGE_UNAVAILABLE" });

// The public brief excludes the reference architecture, rubric and graph.
export function problemBrief({ problem, interview }, custom = false) {
    const topicStages = ["Core Flow", "Data Model", "Scaling", "High Level Design"];
    const concepts = topicStages.flatMap(name =>
        (interview.stages.find(stage => stage.name === name)?.completionCriteria ?? [])
            .slice(0, 2).flatMap(criterion => criterion.concepts.slice(0, 1))
    );
    return {
        ...problem,
        estimatedDuration: interview.estimatedDuration,
        difficultyLevels: interview.difficultyLevels,
        concepts: [...new Set(concepts)],
        ...(custom ? { custom: true } : {})
    };
}

export class CustomProblemService {

    static async get(id, userId) {

        if (!userId || !CUSTOM_PROBLEM_ID.test(id)) throw missing();

        const { data, error } = await supabase.from("custom_problems")

            .select("*").eq("id", id).eq("user_id", userId).maybeSingle();

        if (error) throw storageFailure();

        if (!data) throw missing();

        return data;

    }

    static async list(userId) {

        if (!userId) return [];

        const { data, error } = await supabase.from("custom_problems")

            .select("*").eq("user_id", userId).order("created_at", { ascending: false });

        if (error) throw storageFailure();

        return data ?? [];

    }

    static validate(row) {

        const result = KnowledgeBundleSchema.safeParse(row.knowledge);

        if (!result.success || result.data.problem.id !== row.id) throw storageFailure();

        return result.data;

    }

    static async knowledge(id, userId) {

        const row = await this.get(id, userId);

        return { id, ...this.validate(row) };

    }

    static async create(userId, topic, candidates) {

        const classified = await classifyTopic(topic, candidates);

        if (classified.classification !== "SYSTEM_DESIGN") {

            const lowLevel = classified.classification === "LOW_LEVEL_DESIGN";

            const suggestion = lowLevel ? classified.suggestedHldTopic ?? "Design a scalable software service with APIs, storage and reliability requirements" : undefined;

            throw Object.assign(new Error(lowLevel

                ? "This platform practices high-level system design rather than class or object-oriented design. Try the suggested architecture-level topic."

                : "Choose a software system design topic, such as a product, service or platform you want to architect."), {

                status: 422, code: classified.classification, ...(suggestion ? { suggestion } : {})

            });

        }

        const match = candidates.find(problem => problem.id === classified.matchedProblemId);

        if (match) {

            if (match.custom) await this.get(match.id, userId);

            return { problem: match, matched: true };

        }

        const id = `custom_${randomBytes(16).toString("hex")}`;

        const knowledge = KnowledgeBundleSchema.parse(await generateProblem(topic, id));

        const base = topic.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 80) || "custom_problem";

        const { error } = await supabase.from("custom_problems").insert({

            id, user_id: userId, topic, slug: `${base}_${id.slice(-8)}`, knowledge

        });

        if (error) throw storageFailure();

        return { problem: problemBrief(knowledge, true), matched: false };

    }

}

import fs from "fs";
import path from "path";
import { KNOWLEDGE_DIR } from "../config/paths.js";

function readJSON(base, file) {
    return JSON.parse(
        fs.readFileSync(
            path.join(base, file),
            "utf-8"
        )
    );
}

// Built-ins remain synchronous for existing eval callers; database-backed
// custom packs return a promise. Interview callers await either form.
export function loadKnowledge(problemId, userId) {

    if (typeof problemId === "string" && problemId.startsWith("custom_")) {

        return import("./problem/customProblem.service.js")

            .then(({ CustomProblemService }) => CustomProblemService.knowledge(problemId, userId));

    }

    if (!/^[a-z0-9_]{1,64}$/.test(problemId ?? "")) {

        throw Object.assign(new Error("Problem not found"), { code: "ENOENT", status: 404 });

    }

    const base = path.join(
        KNOWLEDGE_DIR,
        problemId
    );

    return {

        id: problemId,

        problem: readJSON(base, "problem.json"),

        architecture: readJSON(base, "architecture.json"),

        evaluation: readJSON(base, "evaluation.json"),

        graph: readJSON(base, "graph.json"),

        interview: readJSON(base, "interview.json")

    };

}

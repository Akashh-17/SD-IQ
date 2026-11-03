import fs from "fs";
import path from "path";

function readJSON(base, file) {
    return JSON.parse(
        fs.readFileSync(
            path.join(base, file),
            "utf-8"
        )
    );
}

export function loadKnowledge(problemId) {

    const base = path.join(
        process.cwd(),
        "src",
        "knowledge",
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
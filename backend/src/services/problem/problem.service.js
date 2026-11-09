import { logWarn } from "../../utils/logger.js";
import fs from "fs/promises";
import path from "path";

import { KNOWLEDGE_DIR } from "../../config/paths.js";
import { CustomProblemService, problemBrief } from "./customProblem.service.js";

export class ProblemService {

    // =====================================================
    // All Problems
    // =====================================================

    static async getAll(userId) {

        const entries = await fs.readdir(

            KNOWLEDGE_DIR,

            {

                withFileTypes: true

            }

        );

        const problems = [];

        for (const entry of entries) {

            if (!entry.isDirectory())

                continue;

            try {

                const problem = await this.get(

                    entry.name

                );

                problems.push(problem);

            }

            catch (err) {

                logWarn(

                    `Skipping ${entry.name}`,

                    err.message

                );

            }

        }

        if (userId) {

            const custom = await CustomProblemService.list(userId);

            problems.push(...custom.map(row => problemBrief(CustomProblemService.validate(row), true)));

        }

        return problems;

    }

    // =====================================================
    // Single Problem
    // =====================================================

    static async get(problemId, userId) {

        if (typeof problemId === "string" && problemId.startsWith("custom_")) {

            const row = await CustomProblemService.get(problemId, userId);

            return problemBrief(CustomProblemService.validate(row), true);

        }

        // Only plain folder names: blocks "../" path traversal even
        // if a caller skips request validation
        if (!/^[a-z0-9_]{1,64}$/.test(problemId ?? "")) {

            const err = new Error(`Unknown problem: ${problemId}`);

            err.code = "ENOENT";

            throw err;

        }

        const file = path.join(

            KNOWLEDGE_DIR,

            problemId,

            "problem.json"

        );

        const [problem, interview] = await Promise.all([

            fs.readFile(file, "utf8").then(JSON.parse),

            fs.readFile(path.join(KNOWLEDGE_DIR, problemId, "interview.json"), "utf8").then(JSON.parse)

        ]);

        return problemBrief({ problem, interview });

    }

}

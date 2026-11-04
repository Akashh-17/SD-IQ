import fs from "fs/promises";
import path from "path";

import { KNOWLEDGE_DIR } from "../../config/paths.js";

export class ProblemService {

    // =====================================================
    // All Problems
    // =====================================================

    static async getAll() {

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

                console.warn(

                    `Skipping ${entry.name}`,

                    err.message

                );

            }

        }

        return problems;

    }

    // =====================================================
    // Single Problem
    // =====================================================

    static async get(problemId) {

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

        const json = JSON.parse(

            await fs.readFile(

                file,

                "utf8"

            )

        );

        return json;

    }

}
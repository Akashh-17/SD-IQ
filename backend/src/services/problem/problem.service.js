import fs from "fs/promises";
import path from "path";

const KNOWLEDGE_DIR = path.resolve("src/knowledge");

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
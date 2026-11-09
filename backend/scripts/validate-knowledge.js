import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { KNOWLEDGE_DIR } from "../src/config/paths.js";
import { KNOWLEDGE_FILES, KnowledgeBundleSchema } from "../src/knowledge/schema.js";

export async function validateKnowledge(root = KNOWLEDGE_DIR) {
    const errors = [];
    const problems = [];
    let folders;
    try { folders = (await readdir(root, { withFileTypes: true })).filter(entry => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name)); }
    catch { return { ok: false, problems, errors: [`${root}: cannot read knowledge directory`] }; }
    if (!folders.length) errors.push(`${root}: no problem folders found`);
    for (const folder of folders) {
        const bundle = {};
        let complete = true;
        for (const filename of KNOWLEDGE_FILES) {
            const file = path.join(root, folder.name, filename);
            try { bundle[filename.slice(0, -5)] = JSON.parse(await readFile(file, "utf8")); }
            catch (error) { complete = false; errors.push(`${folder.name}/${filename}: ${error.code === "ENOENT" ? "missing required file" : "cannot read valid JSON"}`); }
        }
        if (!complete) continue;
        if (bundle.problem?.id !== folder.name) errors.push(`${folder.name}/problem.json: id must equal the folder name`);
        const result = KnowledgeBundleSchema.safeParse(bundle);
        if (!result.success) {
            for (const issue of result.error.issues) errors.push(`${folder.name}/${issue.path.join(".")}: ${issue.message}`);
        } else if (bundle.problem.id === folder.name) problems.push(bundle.problem.id);
    }
    return { ok: errors.length === 0, problems, errors };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const root = process.argv[2] ?? KNOWLEDGE_DIR;
    if (!path.isAbsolute(root)) {
        console.error("FAIL knowledge root must be an absolute path");
        process.exitCode = 1;
    } else {
        const result = await validateKnowledge(root);
        for (const id of result.problems) console.log(`PASS ${id}: 5 files, 7 stages, consistent rubric, graph and scale`);
        for (const error of result.errors) console.error(`FAIL ${error}`);
        console.log(`${result.ok ? "Validated" : "Validation failed for"} ${result.problems.length} problem(s); ${result.errors.length} error(s)`);
        process.exitCode = result.ok ? 0 : 1;
    }
}

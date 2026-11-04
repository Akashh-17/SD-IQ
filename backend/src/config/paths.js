import path from "path";
import { fileURLToPath } from "url";

// Absolute paths resolved from this file's location, so the server
// works no matter which directory it's started from
// (process.cwd() / relative paths only worked from backend/).

export const BACKEND_ROOT = path.resolve(

    path.dirname(fileURLToPath(import.meta.url)),

    "../.."

);

export const KNOWLEDGE_DIR = path.join(BACKEND_ROOT, "src", "knowledge");

export const UPLOADS_DIR = path.join(BACKEND_ROOT, "uploads");

export const LOG_FILE = path.join(BACKEND_ROOT, "sample.txt");

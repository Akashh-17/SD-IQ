import path from "path";
import dotenv from "dotenv";
import { BACKEND_ROOT } from "./paths.js";

// Loaded first by server.js. .env.local overrides .env
// (dotenv never overwrites a variable that's already set).
dotenv.config({ path: path.join(BACKEND_ROOT, ".env.local"), quiet: true });
dotenv.config({ path: path.join(BACKEND_ROOT, ".env"), quiet: true });

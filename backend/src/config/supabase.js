import { MOCK_MODE } from "../services/mock/mode.js";
import { MemorySupabase } from "../services/mock/supabase.js";
import { createClient } from "@supabase/supabase-js";

export const supabase = MOCK_MODE ? new MemorySupabase() : createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);
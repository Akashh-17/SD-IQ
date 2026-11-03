import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { supabase } from "../config/supabase.js";

const router = Router();

// =====================================================
// Get Interview History
// =====================================================

router.get("/", auth, async (req, res) => {

    const { data, error } = await supabase

        .from("interviews")

        .select("*")

        .eq("user_id", req.user.id)

        .order("started_at", {

            ascending: false

        });

    if (error) {

        return res.status(500).json({

            message: error.message

        });

    }

    res.json(data);

});

export default router;
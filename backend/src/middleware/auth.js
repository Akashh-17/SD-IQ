import { supabase } from "../config/supabase.js";

export async function auth(req, res, next) {

    try {

        const authHeader = req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({

                message: "Missing Authorization Header"

            });

        }

        const token = authHeader.replace(

            "Bearer ",

            ""

        );

        const {

            data,

            error

        } = await supabase.auth.getUser(token);

        if (error || !data.user) {

            return res.status(401).json({

                message: "Invalid Token"

            });

        }

        req.user = data.user;

        next();

    }

    catch (err) {

        console.error(err);

        return res.status(500).json({

            message: "Authentication Failed"

        });

    }

}
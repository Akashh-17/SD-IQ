import axios from "axios";
import { supabase } from "../lib/supabase";
import {API_URL} from "../config";

const API = `${API_URL}/api`;

export async function sendInterviewMessage(
    interviewId: string,
    message: string
) {

    const {
        data: { session }
    } = await supabase.auth.getSession();

    const res = await axios.post(

        `${API}/interview/message`,

        {
            interviewId,
            message
        },

        {
            headers: {
                Authorization: `Bearer ${session?.access_token}`
            }
        }

    );

    return res.data.reply;

}
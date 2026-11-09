import axios from "axios";
import { supabase } from "../lib/supabase";
import {API_URL} from "../config";

const API = `${API_URL}/api`;

export async function endInterview(

    interviewId: string,
    signal?: AbortSignal

) {

    const {

        data: { session }

    } = await supabase.auth.getSession();

    const res = await axios.post(

        `${API}/interview/end`,

        {

            interviewId

        },

        {

            signal,
            headers: {

                Authorization:

                    `Bearer ${session?.access_token}`

            }

        }

    );

    return res.data as { status: "generating" | "ready" };

}
export type ReportStatus = {
    status: "generating" | "ready" | "failed";
    error?: string;
};

export async function getReportStatus(interviewId: string, signal?: AbortSignal): Promise<ReportStatus> {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await axios.get(`${API}/report/${interviewId}/status`, {
        signal,
        headers: { Authorization: `Bearer ${session?.access_token}` }
    });
    const data = response.data as ReportStatus;
    if (!["generating", "ready", "failed"].includes(data.status)) throw new Error("Invalid report status");
    return data;
}

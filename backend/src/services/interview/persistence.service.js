import { supabase } from "../../config/supabase.js";

export class PersistenceService {

    static async save(session) {

        // =====================================================
        // Interview
        // =====================================================

        const {

            data: interview,

            error: interviewError

        } = await supabase

            .from("interviews")

            .insert({

                interview_id: session.interview.interviewId,

                user_id: session.interview.userId,

                title: session.interview.title,

                difficulty: session.interview.difficulty ?? "SDE1",

                problem_difficulty:

                    session.interview.problemDifficulty ?? "Medium",

                status: "COMPLETED",

                overall_score: session.report?.overallScore ?? 0,

                completed_at: new Date().toISOString()


            })

            .select()

            .single();

        if (interviewError)
            throw interviewError;

        session.interview.status = "COMPLETED";

        // =====================================================
        // Report
        // =====================================================

        const {

            error: reportError

        } = await supabase

            .from("reports")

            .insert({

                interview_id: interview.id,

                summary: session.report?.summary ?? "",

                strengths: session.report?.strengths ?? [],

                weaknesses: session.report?.weaknesses ?? [],

                recommendations:

                    session.report?.recommendations ?? [],

                stage_breakdown:

                    session.report?.stageBreakdown ?? {},

                transcript:

                    session.transcript ?? [],

                report:

                    session.report ?? {}

            });

        if (reportError)

            throw reportError;

        // =====================================================
        // Graph
        // =====================================================

        const {

            error: graphError

        } = await supabase

            .from("graphs")

            .insert({

                interview_id: interview.id,

                graph: {

                    nodes:

                        session.graph?.nodes ?? [],

                    edges:

                        session.graph?.edges ?? []

                },

                analysis:

                    session.graph?.analysis ?? {}

            });

        if (graphError)

            throw graphError;

        return interview;

    }

    // =====================================================
    // Load Report
    // =====================================================

    static async getReport(interviewId) {

        // =====================================================
        // Interview
        // =====================================================

        const {

            data: interview,

            error: interviewError

        } = await supabase

            .from("interviews")

            .select("*")

            .eq(

                "interview_id",

                interviewId

            )

            .single();

        if (interviewError)

            throw interviewError;

        // =====================================================
        // Report
        // =====================================================

        const {

            data: report,

            error: reportError

        } = await supabase

            .from("reports")

            .select("*")

            .eq(

                "interview_id",

                interview.id

            )

            .single();

        if (reportError)

            throw reportError;

        // =====================================================
        // Flatten Response
        // =====================================================

        return {

            interview,

            report: {

                ...report.report,

                summary: report.summary,

                strengths: report.strengths,

                weaknesses: report.weaknesses,

                recommendations: report.recommendations,

                stageBreakdown: report.stage_breakdown,

                transcript: report.transcript,

                createdAt: report.created_at

            }

        };

    }
}
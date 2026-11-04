import { supabase } from "../../config/supabase.js";

export class PersistenceService {

    // Safe to retry after a partial failure:
    // - the interview row is upserted on interview_id
    // - graph and report rows are replaced, not duplicated
    // - the report row is written LAST, so "report exists" means
    //   everything was saved (ReportService relies on this)
    static async save(session) {

        // =====================================================
        // Interview
        // =====================================================

        const {

            data: interview,

            error: interviewError

        } = await supabase

            .from("interviews")

            .upsert({

                interview_id: session.interview.interviewId,

                user_id: session.interview.userId,

                title: session.interview.title,

                difficulty: session.interview.difficulty ?? "SDE1",

                problem_difficulty:

                    session.interview.problemDifficulty ?? "Medium",

                status: "COMPLETED",

                overall_score: session.report?.overallScore ?? 0,

                completed_at: new Date().toISOString()


            }, {

                onConflict: "interview_id"

            })

            .select()

            .single();

        if (interviewError)
            throw interviewError;

        session.interview.status = "COMPLETED";

        await this.replaceChild("graphs", interview.id, {

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

        await this.replaceChild("reports", interview.id, {

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

        return interview;

    }

    // Deletes any rows from an earlier attempt, then inserts
    static async replaceChild(table, interviewRowId, row) {

        const { error: deleteError } = await supabase

            .from(table)

            .delete()

            .eq("interview_id", interviewRowId);

        if (deleteError)

            throw deleteError;

        const { error: insertError } = await supabase

            .from(table)

            .insert(row);

        if (insertError)

            throw insertError;

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

            .maybeSingle();

        if (interviewError)

            throw interviewError;

        // Not finished yet, or no such interview
        if (!interview)

            return null;

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

            .maybeSingle();

        if (reportError)

            throw reportError;

        if (!report)

            return null;

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
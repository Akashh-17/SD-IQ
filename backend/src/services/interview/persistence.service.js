import { supabase } from "../../config/supabase.js";

export class PersistenceService {

    // Safe to retry after a partial failure:
    // - the interview row is upserted on interview_id
    // - graph and report rows are replaced, not duplicated
    // - the report row is written LAST, so "report exists" means
    //   everything was saved (ReportService relies on this)
    static async save(session) {

        const completedAt = new Date().toISOString();
        const startedAt = session.interview.startedAt;
        // Replay/timing metadata lives in the existing report JSON column.
        const reportContext = {
            ...(session.interview.problemId ? { problemId: session.interview.problemId } : {}),
            ...(Number.isFinite(startedAt) ? {
                startedAt,
                completedAt,
                durationMs: Math.max(0, new Date(completedAt).getTime() - startedAt)
            } : {})
        };

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

                completed_at: completedAt


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

                    session.graph?.edges ?? [],

                // Full drawing for the report's read-only whiteboard
                ...(session.scene ? { scene: session.scene } : {})

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

                { ...session.report, ...reportContext }

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

    static async getReport(interviewId, { userId, includeGraph = false } = {}) {

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
        if (!interview || (userId && interview.user_id !== userId))

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

        // Status/lock checks keep their existing light read path. The owner-only
        // report view opts into the durable snapshot after ownership is checked.
        let graph;
        if (includeGraph) {
            const { data: snapshot, error } = await supabase
                .from("graphs")
                .select("graph, analysis")
                .eq("interview_id", interview.id)
                .maybeSingle();
            if (error) throw error;
            graph = snapshot ? { ...snapshot.graph, analysis: snapshot.analysis } : null;
        }

        // =====================================================
        // Flatten Response
        // =====================================================

        return {

            interview,

            ...(includeGraph ? { graph } : {}),

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

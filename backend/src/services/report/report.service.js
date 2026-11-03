import { SessionService } from "../interview/session.service.js";
import { PersistenceService } from "../interview/persistence.service.js";
import { generateInterviewReport } from "./reportGenerator.js";

export class ReportService {

    static async generate(interviewId, state) {

        // =====================================================
        // Load Active Session
        // =====================================================

        const session = await SessionService.get(interviewId);

        if (!session) {

            throw new Error("Interview session not found.");

        }

        // =====================================================
        // Generate Report
        // =====================================================

        const report = await generateInterviewReport(

            state,

            session

        );

        // =====================================================
        // Save Report in Redis
        // =====================================================

        await SessionService.saveReport(

            interviewId,

            report

        );

        session.report = report;

        // =====================================================
        // Persist to Supabase
        // =====================================================

        await PersistenceService.save(

            session

        );

        // =====================================================
        // Remove Redis Session
        // =====================================================

        await SessionService.delete(

            interviewId

        );

        return report;

    }

}
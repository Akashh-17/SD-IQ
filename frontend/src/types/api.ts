export interface Problem {
    id: string;
    title: string;
    problemDifficulty: string;
    difficulty?: string;
    category?: string;
}
export interface InterviewRecord {
    id: string;
    interview_id: string;
    title: string;
    difficulty: string;
    problem_difficulty: string;
    status: string;
    overall_score: number | null;
    completed_at: string;
}
export interface StageScore {
    stage?: string;
    name?: string;
    score?: number | string;
    value?: number | string;
    feedback?: string;
}
export type StageBreakdown = StageScore[] | Record<string, number | string>;
export interface InterviewReport {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    stageBreakdown?: StageBreakdown;
    stage_breakdown?: StageBreakdown;
}
export interface ReportResponse {
    interview: InterviewRecord;
    report: InterviewReport;
}

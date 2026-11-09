import { logError } from "../../utils/logger.js";
import { llm } from "../llm.js";
import { log } from "../../utils/logger.js";

const round1 = (n) => Math.round(n * 10) / 10;

// Average evaluator score (0-10) per stage, in interview order
export function computeStageScores(evaluations = []) {

    const stages = new Map();

    for (const e of evaluations) {

        if (typeof e.score !== "number") continue;

        const entry = stages.get(e.stage) ?? { total: 0, answers: 0 };

        entry.total += e.score;
        entry.answers += 1;

        stages.set(e.stage, entry);

    }

    return [...stages].map(([stage, { total, answers }]) => ({

        stage,

        score: round1(total / answers),

        answers

    }));

}

export async function generateInterviewReport(state, session) {

    const evaluations = state.evaluations ?? [];

    const stageScores = computeStageScores(evaluations);

    log("REPORT INPUT", {
        evaluations: evaluations.length,
        stageScores
    });

    const prompt = `
You are a Google Staff Engineer.

Generate a professional interview report covering the WHOLE interview,
not just the last answer.

Evaluation History (one entry per evaluated answer, in order)

${JSON.stringify(evaluations, null, 2)}

Average Score Per Stage (0-10, computed from the history)

${JSON.stringify(stageScores, null, 2)}

In "stageBreakdown", use exactly these stage names and these scores.

Graph Analysis

${JSON.stringify(state.graphAnalysis, null, 2)}

Transcript

${JSON.stringify(session.transcript, null, 2)}

Return ONLY a valid JSON object.

Do NOT wrap the JSON in markdown.

{
    "overallScore":0,

    "candidateLevel":"",

    "summary":"",

    "strengths":[],

    "weaknesses":[],

    "recommendations":[],

    "stageBreakdown":[
        {
            "stage":"",
            "score":0,
            "feedback":""
        }
    ]
}
`;

    const res = await llm.invoke(prompt);

    log("RAW REPORT", res.content);

    let content = res.content;

    // Remove markdown code fences if present
    content = content
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    let report;

    try {

        report = JSON.parse(content);

    }

    catch (err) {

        logError("Invalid report JSON from the LLM");

        log("INVALID REPORT JSON", content);

        throw err;

    }

    // =====================================================
    // Scores come from the evaluator history, not the LLM,
    // so they are consistent and reproducible. The LLM only
    // writes the feedback text.
    // =====================================================

    if (stageScores.length) {

        report.overallScore = round1(

            stageScores.reduce((sum, s) => sum + s.score, 0) /
            stageScores.length

        );

        const feedback = new Map(

            (report.stageBreakdown ?? []).map(s => [s.stage, s.feedback])

        );

        report.stageBreakdown = stageScores.map(s => ({

            stage: s.stage,

            score: s.score,

            feedback: feedback.get(s.stage) ?? ""

        }));

    }

    return report;

}
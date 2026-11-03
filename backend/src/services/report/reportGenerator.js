import { llm } from "../llm.js";

export async function generateInterviewReport(state, session) {
    
    console.log("===== REPORT INPUT =====");
    console.log("Candidate Evaluation:");
    console.dir(state.candidate, { depth: null });

    console.log("Graph Analysis:");
    console.dir(state.graphAnalysis, { depth: null });

    console.log("Transcript:");
    console.dir(session.transcript, { depth: null });
    console.log("========================");

    const prompt = `
You are a Google Staff Engineer.

Generate a professional interview report.

Candidate Evaluation

${JSON.stringify(state.candidate.evaluation, null, 2)}

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

    console.log("========== RAW REPORT ==========");
    console.log(res.content);
    console.log("================================");

    let content = res.content;

    // Remove markdown code fences if present
    content = content
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

    try {

        return JSON.parse(content);

    }

    catch (err) {

        console.error("Invalid Report JSON:");

        console.log(content);

        throw err;

    }

}
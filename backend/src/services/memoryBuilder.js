// =====================================================
// Interview memory
// Built after every interviewer turn, with no extra LLM call:
// - previousQuestions: what the interviewer has already asked,
//   so it doesn't repeat itself
// - summary: a compact digest of the recent evaluated answers,
//   read by the evaluator, conversation manager and interviewer
// =====================================================

const MAX_QUESTIONS = 10;

const MAX_SUMMARY_ENTRIES = 6;

const clip = (text = "", max) =>

    text.length > max ? `${text.slice(0, max)}…` : text;

export function buildMemory(state, interviewerMessage) {

    const previousQuestions = [

        ...(state.memory?.previousQuestions ?? []),

        clip(interviewerMessage, 300)

    ].slice(-MAX_QUESTIONS);

    const summary = (state.evaluations ?? [])

        .slice(-MAX_SUMMARY_ENTRIES)

        .map(e => {

            const missing = e.criticalMissingConcepts?.length

                ? `; missing: ${e.criticalMissingConcepts.join(", ")}`

                : "";

            return `[${e.stage}] Q: ${clip(e.question, 150)} → ` +
                `A: ${clip(e.answer, 200)} (score ${e.score}/10${missing})`;

        })

        .join("\n");

    return {

        ...state.memory,

        previousQuestions,

        summary

    };

}

import { generateInterviewerResponse } from "../agents/interviewer/agent.js";
import { buildInterviewerContext } from "../services/contextBuilder.js";
import { ReportService } from "../services/report/report.service.js";
import { log } from "../utils/logger.js";

export async function interviewNode(state) {

    // =====================================================
    // Initial Greeting
    // =====================================================

    if (!state.interview.started) {

        const firstStage =
            state.knowledge.interview.stages[0];

        return {

            interview: {

                ...state.interview,

                started: true,

                stage: firstStage.name,

                progress: 0,

                currentQuestion: firstStage.entryQuestion,

                objective: {

                    name: firstStage.name,

                    description: firstStage.objective,

                    completionCriteria: firstStage.completionCriteria,

                    completedCriteria: []

                }

            },

            messages: [

                {

                    role: "assistant",

                    content:
                        `Hi! I'm your interviewer today.

We'll be designing **${state.knowledge.problem.title}**.

${firstStage.entryQuestion}`

                }

            ]

        };

    }

    // =====================================================
    // Generate Interviewer Response
    // =====================================================

    const interviewerState =
        buildInterviewerContext(state);

    const response =
        await generateInterviewerResponse(interviewerState);

    log("INTERVIEWER", response);

    // =====================================================
    // Interview Finished
    // =====================================================

    if (

        state.conversation?.decision === "END_INTERVIEW" &&

        !state.interview.reportGenerated

    ) {

        try {

            const report = await ReportService.generate(

                state.interview.interviewId,

                state

            );

            log("REPORT GENERATED", report);

            return {

                interview: {

                    ...state.interview,

                    completed: true,

                    reportGenerated: true,

                    currentQuestion: response

                },

                report,

                messages: [

                    {

                        role: "assistant",

                        content: response

                    }

                ]

            };

        }

        catch (err) {

            console.error("REPORT ERROR", err);

            return {

                interview: {

                    ...state.interview,

                    currentQuestion: response

                },

                messages: [

                    {

                        role: "assistant",

                        content: response

                    }

                ]

            };

        }

    }

    // =====================================================
    // Normal Response
    // =====================================================

    return {

        interview: {

            ...state.interview,

            currentQuestion: response

        },

        messages: [

            {

                role: "assistant",

                content: response

            }

        ]

    };

}
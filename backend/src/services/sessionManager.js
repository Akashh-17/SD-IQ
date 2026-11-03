import { log } from "../utils/logger.js";

export class SessionManager {

    // ==========================================================
    // Candidate
    // ==========================================================

    static setCandidateMessage(state, message) {

        return {

            candidate: {

                ...state.candidate,

                latestMessage: message

            }

        };

    }

    static setIntent(state, intent) {

        return {

            candidate: {

                ...state.candidate,

                intent

            }

        };

    }

    static setEvaluation(state, evaluation) {

        // ======================================================
        // Merge Topic Tracker
        // ======================================================

        const topicTracker = {

            ...(state.interview.topicTracker || {})

        };

        for (const topic of evaluation.mentionedTopics || []) {

            const previous = topicTracker[topic.topic] || {

                mentioned: false,

                understood: false,

                explored: false,

                probesAsked: 0,

                stage: state.interview.stage

            };

            topicTracker[topic.topic] = {

                ...previous,

                mentioned: true,

                explored: true,

                understood:

                    previous.understood ||

                    !topic.needsProbe,

                stage:
                    state.interview.stage

            };

        }

        // ======================================================
        // Merge Completed Criteria
        // ======================================================

        const completedCriteria = new Set(

            state.interview.objective?.completedCriteria || []

        );

        for (const criterion of evaluation.completedCriteria || []) {

            completedCriteria.add(criterion);

        }

        log("SESSION UPDATE", {

            completedCriteria:

                [...completedCriteria],

            topicTracker

        });

        return {

            candidate: {

                ...state.candidate,

                evaluation,

                strengths:
                    evaluation.strengths,

                weaknesses:
                    evaluation.weaknesses,

                architectureChoices:
                    evaluation.architectureChoices,

                assumptions:
                    evaluation.assumptions,

                level:
                    evaluation.candidateLevel

            },

            interview: {

                ...state.interview,

                topicTracker,

                objective: {

                    ...state.interview.objective,

                    completedCriteria:

                        [...completedCriteria]

                }

            }

        };

    }

    // ==========================================================
    // Conversation Decision
    // ==========================================================

    static applyConversationDecision(state, decision) {

        let interview = {

            ...state.interview

        };

        // ======================================================
        // Increment probe count
        // ======================================================

        const topicTracker = {

            ...(interview.topicTracker || {})

        };

        if (

            decision.decision === "PROBE_TOPIC" &&

            decision.targetTopic &&

            topicTracker[decision.targetTopic]

        ) {

            topicTracker[decision.targetTopic] = {

                ...topicTracker[decision.targetTopic],

                probesAsked:

                    topicTracker[decision.targetTopic].probesAsked + 1

            };

        }

        interview.topicTracker = topicTracker;

        // ======================================================
        // Stage Transition
        // ======================================================

        if (decision.decision === "MOVE_TOPIC") {

            const stages =
                state.knowledge.interview.stages;

            const currentIndex =
                stages.findIndex(

                    s => s.name === interview.stage

                );

            const nextStage =
                stages[currentIndex + 1];

            if (nextStage) {

                interview = {

                    ...interview,

                    stage:
                        nextStage.name,

                    currentQuestion:
                        nextStage.entryQuestion,

                    progress:
                        Math.round(

                            ((currentIndex + 2) / stages.length) * 100

                        ),

                    objective: {

                        name:
                            nextStage.name,

                        description:
                            nextStage.objective,

                        completionCriteria:
                            nextStage.completionCriteria,

                        completedCriteria: []

                    }

                };

            }

            else {

                interview.completed = true;

                interview.progress = 100;

            }

        }

        // ======================================================
        // Mark interview finished
        // ======================================================

        if (decision.decision === "END_INTERVIEW") {

            interview = {

                ...interview,

                completed: true,

                progress: 100

            };

        }

        return {

            conversation: {

                ...state.conversation,

                ...decision

            },

            interview

        };

    }

    // ==========================================================
    // Memory
    // ==========================================================

    static updateMemory(state, updates) {

        return {

            memory: {

                ...state.memory,

                ...updates

            }

        };

    }

    // ==========================================================
    // Graph
    // ==========================================================

    static setGraph(state, graph) {

        return {

            graph

        };

    }

    // =====================================================
    // Report
    // =====================================================

    static async saveReport(interviewId, report) {

        const session = await this.get(interviewId);

        if (!session) return null;

        session.report = report;

        await this.save(

            interviewId,

            session

        );

        return report;

    }

    static async getReport(interviewId) {

        const session = await this.get(interviewId);

        return session?.report ?? null;

    }

}
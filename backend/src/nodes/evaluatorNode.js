import { logError } from "../utils/logger.js";
import { evaluateAnswer } from "../agents/evaluator/agent.js";
import { buildEvaluatorContext } from "../services/contextBuilder.js";
import { SessionManager } from "../services/sessionManager.js";
import { log } from "../utils/logger.js";

export async function evaluatorNode(state) {

    try {

        const context = buildEvaluatorContext(state);

        const evaluation = await evaluateAnswer(context);

        log("EVALUATION", {

            answeredCurrentQuestion:
                evaluation.answeredCurrentQuestion,

            score:
                evaluation.score,

            level:
                evaluation.candidateLevel,

            mentionedTopics:
                evaluation.mentionedTopics,

            completedCriteria:
                evaluation.completedCriteria,

            criticalMissing:
                evaluation.criticalMissingConcepts,

            readyToMove:
                evaluation.readyToMove

        });

        return SessionManager.setEvaluation(
            state,
            evaluation
        );

    } catch (err) {

        logError("[Evaluator]", err);

        return SessionManager.setEvaluation(state, {

            answeredCurrentQuestion: false,

            score: 0,

            candidateLevel: state.candidate.level,

            strengths: [],

            weaknesses: ["Evaluation failed"],

            coveredConcepts: [],

            missingConcepts: [],

            incorrectConcepts: [],

            architectureChoices: [],

            reasoning: err.message,
            failed: true

        });

    }

}
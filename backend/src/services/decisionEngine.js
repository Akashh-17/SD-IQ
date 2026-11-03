export function decideNextAction(state) {

    const evaluation = state.candidate.evaluation;

    const interview = state.interview;

    const objective = interview.objective;

    const tracker = interview.topicTracker || {};

    // =====================================================
    // Intent Handling
    // =====================================================

    const intent = state.candidate.intent;

    // Candidate asked interviewer something

    if (intent?.intent === "CLARIFICATION") {

        return {

            decision: "ANSWER",

            targetTopic: "",

            targetConcept: "",

            objective,

            reason: "Candidate requested clarification."

        };

    }

    // Candidate asked a general question

    if (intent?.intent === "QUESTION") {

        return {

            decision: "ANSWER",

            targetTopic: "",

            targetConcept: "",

            objective,

            reason: "Candidate asked the interviewer a question."

        };

    }

    // Candidate wants to finish

    if (intent?.intent === "WRAP_UP") {

        return {

            decision: "END_INTERVIEW",

            targetTopic: "",

            targetConcept: "",

            objective,

            reason: "Candidate ended the interview."

        };

    }

    // Simple acknowledgement

    if (

        intent?.intent === "ACKNOWLEDGEMENT" ||

        intent?.intent === "SMALL_TALK"

    ) {

        return {

            decision: "FOLLOW_UP",

            targetTopic: "",

            targetConcept: "",

            objective,

            reason: "Continue the interview."

        };

    }

    // =====================================================
    // 1. Candidate didn't answer the question
    // =====================================================

    if (!evaluation?.answeredCurrentQuestion) {

        return {

            decision: "FOLLOW_UP",

            targetTopic: "",

            targetConcept: "",

            objective,

            reason:
                "Candidate did not answer the current interview question."

        };

    }

    // =====================================================
    // 2. Probe mentioned topics (max twice)
    // =====================================================

    for (const topic of evaluation.mentionedTopics || []) {

        const tracked = tracker[topic.topic];

        if (!tracked) continue;

        if (

            tracked.mentioned &&

            !tracked.understood &&

            tracked.probesAsked < 2

        ) {

            return {

                decision: "PROBE_TOPIC",

                targetTopic: topic.topic,

                targetConcept: "",

                objective,

                reason:
                    `${topic.topic} requires deeper explanation.`

            };

        }

    }

    // =====================================================
    // 3. Check remaining completion criteria
    // =====================================================

    const requiredCriteria =

        (objective?.completionCriteria || [])

            .filter(c => c.required);

    const completedCriteria =

        new Set(

            objective?.completedCriteria || []

        );

    const remainingCriteria =

        requiredCriteria.filter(

            c => !completedCriteria.has(c.name)

        );

    if (remainingCriteria.length > 0) {

        const criterion = remainingCriteria[0];

        return {

            decision: "ASK_MISSING",

            targetTopic:
                criterion.name,

            targetConcept:

                criterion.concepts?.[0] ||

                criterion.name,

            objective,

            reason:

                `${criterion.name} has not been sufficiently covered.`

        };

    }

    // =====================================================
    // 4. Ask remaining critical concepts
    // =====================================================

    const missingCritical =

        evaluation.criticalMissingConcepts || [];

    if (missingCritical.length > 0) {

        return {

            decision: "ASK_MISSING",

            targetTopic: "",

            targetConcept:
                missingCritical[0],

            objective,

            reason:

                `${missingCritical[0]} has not been discussed.`

        };

    }

    // =====================================================
    // 5. Current objective complete
    // =====================================================

    return {

        decision: "MOVE_TOPIC",

        targetTopic: "",

        targetConcept: "",

        objective,

        reason:
            "Current interview objective completed."

    };

}

function decide(result) {

    log("DECISION", result);

    return result;

}
import { Annotation, messagesStateReducer } from "@langchain/langgraph";

export const State = Annotation.Root({

  // ===========================
  // Conversation
  // ===========================

  messages: Annotation({
    reducer: messagesStateReducer,
    default: () => [],
  }),

  nextNode: Annotation({
    reducer: (_, b) => b,
    default: () => "interviewer",
  }),
  // ===========================
  // Loaded Knowledge
  // ===========================

  knowledge: Annotation({
    reducer: (_, b) => b,
    default: () => null,
  }),

  // ===========================
  // Interview State
  // ===========================

  interview: Annotation({

    reducer: (a, b) => ({

      ...(a || {}),

      ...(b || {})

    }),

    default: () => ({

      interviewId: null,

      started: false,

      stage: "Requirements",

      progress: 0,

      difficulty: "SDE1",

      completed: false,

      reportGenerated: false,

      currentQuestion: "",

      objective: {
        name: "Requirements",
        description: "",
        completionCriteria: [],
        completedCriteria: []
      },

      topicTracker: {}

    })

  }),

  // ===========================
  // Candidate State
  // ===========================

  candidate: Annotation({

    reducer: (a, b) => ({

      ...(a || {}),

      ...(b || {}),

    }),

    default: () => ({

      latestMessage: "",

      intent: null,

      evaluation: null,

      strengths: [],

      weaknesses: [],

      coveredConcepts: [],

      architectureChoices: [],

      assumptions: [],

      mentionedTopics: [],

      recommendedProbe: null,

      criticalMissingConcepts: [],

      stageCoverage: 0,

      readyToMove: false,

      level: "Unknown"

    }),

  }),

  // ===========================
  // Conversation Manager Output
  // ===========================

  conversation: Annotation({

    reducer: (a, b) => ({

      ...(a || {}),

      ...(b || {})

    }),

    default: () => ({

      decision: null,

      targetTopic: "",

      targetConcept: "",

      objective: null,

      reason: "",

      tone: "NEUTRAL",

      acknowledge: false,

      acknowledgement: "",

      responseStyle: "DIRECT",

      hintLevel: "NONE",

      shouldRespond: true,

      candidateQuestion: "",

    })

  }),

  // ===========================
  // Memory
  // ===========================

  memory: Annotation({
    reducer: (a, b) => ({
      ...(a || {}),
      ...(b || {}),
    }),
    default: () => ({
      summary: "",

      previousQuestions: [],

      importantFacts: [],

      interviewNotes: "",
    }),
  }),

  // ===========================
  // Whiteboard Graph
  // ===========================

  graph: Annotation({
    reducer: (a, b) => ({
      ...(a || {}),
      ...(b || {}),
    }),
    default: () => ({
      nodes: [],
      edges: [],
      analysis: null,
    }),
  }),

  graphConsistency: Annotation({

    reducer: (_, b) => b,

    default: () => ({

      matched: [],

      drawnOnly: [],

      mentioned: [],

      graphNodeCount: 0,

      graphEdgeCount: 0

    })

  }),

  graphAnalysis: Annotation({

    reducer: (_, b) => b,

    default: () => null

  }),

});
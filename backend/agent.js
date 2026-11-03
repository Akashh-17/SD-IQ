import { StateGraph, START, END } from "@langchain/langgraph";

import { State } from "./src/state.js";
import { greetingNode } from "./src/nodes/greetingNode.js";
import { inputNode } from "./src/nodes/inputNode.js";
import { intentNode } from "./src/nodes/intentNode.js";
import { orchestratorNode } from "./src/nodes/orchestratorNode.js";
import { evaluatorNode } from "./src/nodes/evaluatorNode.js";
import { conversationNode } from "./src/nodes/conversationNode.js";
import { interviewNode } from "./src/nodes/interviewNode.js";
import { graphNode } from "./src/nodes/graphNode.js";

export function buildAgent(checkpointer) {

    const workflow = new StateGraph(State);

    // -----------------------------
    // Nodes
    // -----------------------------


    workflow.addNode("input", inputNode);

    workflow.addNode("greeting", greetingNode);

    workflow.addNode("intent", intentNode);

    workflow.addNode("orchestrator", orchestratorNode);

    workflow.addNode("evaluator", evaluatorNode);

    workflow.addNode("conversationManager", conversationNode);

    workflow.addNode("interviewer", interviewNode);

    workflow.addNode("graphAnalyzer", graphNode);

    // -----------------------------
    // Initial Greeting
    // -----------------------------

    workflow.addEdge(START, "greeting");

    workflow.addConditionalEdges(
        "greeting",
        (state) => state.nextNode,
        {
            interviewer: "interviewer",
            input: "input",
        }
    );


    // -----------------------------
    // Normal Interview Flow
    // -----------------------------

    workflow.addEdge(

        "input",

        "graphAnalyzer"

    );

    workflow.addEdge(

        "graphAnalyzer",

        "intent"

    );

    workflow.addEdge("intent", "orchestrator");

    workflow.addConditionalEdges(
        "orchestrator",
        (state) => state.nextNode,
        {
            evaluator: "evaluator",
            conversationManager: "conversationManager",
        }
    );

    workflow.addEdge("evaluator", "conversationManager");

    workflow.addEdge("conversationManager", "interviewer");

    workflow.addEdge("interviewer", END);

    return workflow.compile({
        checkpointer,
    });
}
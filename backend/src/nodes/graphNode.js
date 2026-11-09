import { logError } from "../utils/logger.js";
import { llm } from "../services/llm.js";
import { graphSignature } from "../utils/graphSignature.js";
import { GraphAnalysisSchema } from "../agents/graph/schema.js";
import { log } from "../utils/logger.js";

// Structured output: the response is validated against the schema
// instead of hand-parsing raw JSON (which broke on ```json fences)
const structured = llm.withStructuredOutput(GraphAnalysisSchema);

// =====================================================
// LLM analysis of a whiteboard graph
// Used by the graph node and by graph-only analysis
// when the candidate edits the diagram.
// =====================================================

export async function analyzeGraph(graph) {

  if (!graph?.nodes?.length) {
    return null;
  }

  // Edges reference node ids; resolve them to labels so the model
  // sees "API Gateway -> Redis" rather than "3 -> 7"
  const labelOf = new Map(

    graph.nodes.map(n => [n.id, n.data?.label || n.type || n.id])

  );

  const simplified = {
    nodes: graph.nodes.map(n => ({
      type: n.type,
      label: n.data?.label ?? ""
    })),
    edges: (graph.edges ?? []).map(e => ({
      from: labelOf.get(e.source) ?? e.source,
      to: labelOf.get(e.target) ?? e.target
    }))
  };

  const prompt = `
You are a Staff Software Engineer.

Analyze this system design whiteboard: list its components and
connections, its strengths, its issues, and any missing components,
then summarize it in two or three sentences.

Graph:

${JSON.stringify(simplified, null, 2)}
`;

  try {

    const analysis = await structured.invoke(prompt);

    log("GRAPH ANALYSIS", analysis);

    return analysis;

  }

  catch (e) {

    logError("[Graph Analysis]", e.message);

    // null = "no analysis" (not cached, so the next edit or message
    // retries instead of keeping an empty result for this graph)
    return null;

  }

}

// =====================================================
// Graph node
// Reuses the stored analysis when the diagram has not
// structurally changed since it was produced.
// =====================================================

export async function graphNode(state) {

  log("GRAPH NODE", {
    nodes: state.graph?.nodes?.length ?? 0,
    edges: state.graph?.edges?.length ?? 0
  });

  if (!state.graph?.nodes?.length) {

    return {

      graphAnalysis: null

    };

  }

  if (
    state.graph.analysis &&
    state.graph.analysisSignature === graphSignature(state.graph)
  ) {

    return {

      graphAnalysis: state.graph.analysis

    };

  }

  return {

    graphAnalysis: await analyzeGraph(state.graph)

  };

}

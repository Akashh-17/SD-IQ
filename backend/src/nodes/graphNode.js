import { llm } from "../services/llm.js";

export async function graphNode(state) {

  console.log("\n========== GRAPH NODE ==========");
  console.log("Nodes:", state.graph?.nodes?.length ?? 0);
  console.log("Edges:", state.graph?.edges?.length ?? 0);
  console.log("================================\n");

  if (!state.graph?.nodes?.length) {

    return {

      graphAnalysis: null

    };

  }

  const simplified = {
    nodes: state.graph.nodes.map(n => ({
      type: n.type,
      label: n.data.label
    })),
    edges: state.graph.edges.map(e => ({
      from: e.source,
      to: e.target
    }))
  };

  const prompt = `
You are a Staff Software Engineer.

Analyze this system design whiteboard.

Graph:

${JSON.stringify(simplified, null, 2)}

Return ONLY JSON.

{
    "components":[
        {
            "name":"",
            "type":"",
            "purpose":""
        }
    ],
    "connections":[
        {
            "from":"",
            "to":""
        }
    ],
    "strengths":[],
    "issues":[],
    "missingComponents":[],
    "summary":""
}
`;

  try {

    const res = await llm.invoke(prompt);

    console.log("\n========== GRAPH LLM ==========");
    console.log(res.content);
    console.log("================================\n");

    const analysis = JSON.parse(res.content);

    console.log("\n========== GRAPH ANALYSIS ==========");
    console.dir(analysis, {
      depth: null,
      colors: true
    });
    console.log("====================================\n");

    return {
      graphAnalysis: analysis
    };

    return {

      graphAnalysis:

        JSON.parse(res.content)

    };

  }

  catch (e) {

    return {

      graphAnalysis: {

        components: [],

        connections: [],

        strengths: [],

        issues: [],

        missingComponents: [],

        summary: ""

      }

    };

  }

}
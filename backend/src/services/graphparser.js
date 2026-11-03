function normalize(type) {
  if (type.includes("db")) return "database";
  if (type.includes("cache")) return "cache";
  if (type.includes("api")) return "api";
  if (type.includes("lb")) return "load_balancer";
  return type;
}

function parseGraph(graph) {
  const components = graph.nodes.map((node) =>
    normalize(node.type)
  );

  const connections = graph.edges.map(
    (edge) => `${edge.source}->${edge.target}`
  );

  return {
    components,
    connections,
  };
}

export default parseGraph;
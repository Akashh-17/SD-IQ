// Structural fingerprint of a whiteboard graph.
// Ignores node positions, selection and styling, so dragging a node
// does not count as a change and does not trigger a new analysis.

export function graphSignature(graph) {

    const nodes = (graph?.nodes ?? [])
        .map(n => `${n.id}|${n.type ?? ""}|${n.data?.label ?? ""}`)
        .sort();

    const edges = (graph?.edges ?? [])
        .map(e => `${e.source}>${e.target}|${e.label ?? e.data?.label ?? ""}`)
        .sort();

    return JSON.stringify({ nodes, edges });

}

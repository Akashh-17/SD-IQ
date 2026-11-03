export class GraphContextBuilder {

    static build(graph) {

        if (!graph) {

            return {

                components: [],

                connections: [],

                statistics: {

                    nodes: 0,

                    edges: 0

                }

            };

        }

        const components = [];

        const nodeMap = new Map();

        for (const node of graph.nodes ?? []) {

            const component = {

                id: node.id,

                type: node.type,

                name: node.data?.label ?? node.type

            };

            nodeMap.set(node.id, component);

            components.push(component);

        }

        const connections = [];

        for (const edge of graph.edges ?? []) {

            connections.push({

                from:

                    nodeMap.get(edge.source)?.name ??

                    edge.source,

                to:

                    nodeMap.get(edge.target)?.name ??

                    edge.target

            });

        }

        return {

            components,

            connections,

            statistics: {

                nodes: graph.nodes?.length ?? 0,

                edges: graph.edges?.length ?? 0

            }

        };

    }

}
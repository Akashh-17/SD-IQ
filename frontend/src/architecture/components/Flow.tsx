import {
    ReactFlow,
    ReactFlowProvider,
    Controls,
    Background,
    BackgroundVariant,
    addEdge,
    useEdgesState,
    useNodesState,
    type Connection,
    type Edge,
    type Node,
    useReactFlow,
} from "reactflow";

import { useCallback } from "react";

import "reactflow/dist/style.css";

import Sidebar from "./Sidebar.tsx";
import Inspector from "./Inspector";
import { edgeTypes } from "../edgeTypes";
import { nodeTypes } from "../nodeTypes";

const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];

function FlowCanvas() {

    const [nodes, setNodes, onNodesChange] =
        useNodesState(initialNodes);

    const [edges, setEdges, onEdgesChange] =
        useEdgesState(initialEdges);

    const onConnect = useCallback(

        (connection: Connection) => {

            setEdges((edges) =>

                addEdge(

                    {

                        ...connection,

                        type: "custom",

                        animated: false,

                        data: {

                            label: "HTTP",

                        },

                    },

                    edges

                )

            );

        },

        [setEdges]

    );

    const onDragOver = useCallback(

        (event: React.DragEvent) => {

            event.preventDefault();

            event.dataTransfer.dropEffect = "move";

        },

        []

    );
    const onDrop = useCallback(

        (event: React.DragEvent) => {

            event.preventDefault();

            const payload = JSON.parse(

                event.dataTransfer.getData(
                    "application/reactflow"
                )

            );

            const { screenToFlowPosition } = useReactFlow();
            const position = screenToFlowPosition({

                x: event.clientX,

                y: event.clientY,

            });

            const newNode: Node = {

                id: crypto.randomUUID(),

                type: payload.type,

                position,

                data: payload.data,

            };
            console.log(newNode);

            setNodes((nds) => [...nds, newNode]);

        },

        [setNodes]

    );
    return (

        <div className="flex h-full w-full">

            <Sidebar />

            <div className="flex-1">

                <ReactFlow

                    edgeTypes={edgeTypes}

                    nodes={nodes}

                    edges={edges}

                    nodeTypes={nodeTypes}

                    onNodesChange={onNodesChange}

                    onEdgesChange={onEdgesChange}

                    onConnect={onConnect}

                    onDrop={onDrop}

                    onDragOver={onDragOver}

                    fitView

                >

                    <Background

                        variant={
                            BackgroundVariant.Dots
                        }

                        gap={24}

                        size={1}

                    />

                    <Controls />

                </ReactFlow>

            </div>

            <Inspector />

        </div>

    );

}
export default function Flow() {

    return (

        <ReactFlowProvider>

            <FlowCanvas />

        </ReactFlowProvider>

    );

}
import { useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { getInterviewState } from "../services/interviewState.service";
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    type Connection,
    type ReactFlowInstance,
} from "reactflow";

import "reactflow/dist/style.css";

import Sidebar from "./ComponentSidebar";

import {SqlDbNode, NoSqlDbNode, GraphDBNode, VectorDBNode, TimeSeriesDBNode }from "../nodes/DbNode";
import {RedisCacheNode, MemCacheNode, LocalCacheNode} from "../nodes/CacheNode";
import {QueueNode, EventBusNode, KafkaNode, PublisherNode, SubscriberNode} from "../nodes/MsgNode";
import {CDNNode, DNSNode, FirewallNode, LBNode, ApiNode, ReverseProxyNode} from "../nodes/NetworkNodes";
import {ServiceNode, WorkerNode, CronJobNode} from "../nodes/ServiceNode";
import {BlobStorageNode, ObjStorageNode, FileStorageNode} from "../nodes/StorageNode";
import {ClientNode, AppNode, ThirdPartyNode} from "../nodes/ClientNode";
import {SearchEngineNode, ElasticSearchNode} from "../nodes/SearchNode"

import LabeledEdge from "./LabeledEdge";

import { saveGraph } from "../services/graph.service";
import DiagramHeader from "./diagram/DiagramHeader";

const nodeTypes = {

    // client
    webclient: ClientNode,

    mobile: AppNode,

    thirdparty: ThirdPartyNode,

    //network
    apigateway: ApiNode,

    dns: DNSNode,

    firewall: FirewallNode,

    proxy: ReverseProxyNode,

    lb: LBNode,

    cdn: CDNNode,

    // db
    sqldb: SqlDbNode,

    nosqldb : NoSqlDbNode,

    graphdb: GraphDBNode,

    vectordb: VectorDBNode,

    timeseriesdb: TimeSeriesDBNode,

    // cache
    redis: RedisCacheNode,

    memcache: MemCacheNode,

    localcache: LocalCacheNode,

    // msg
    msgqueue: QueueNode,

    eventbus: EventBusNode,

    publisher: PublisherNode,

    subscribe: SubscriberNode,

    kafka: KafkaNode,

    // search
    searchengine: SearchEngineNode,

    elasticsearch: ElasticSearchNode,

    // compute
    service: ServiceNode,

    cronjob: CronJobNode,

    worker: WorkerNode,

    // storage
    blobstore: BlobStorageNode,

    filestore: FileStorageNode,

    objectstore: ObjStorageNode,
};

const edgeTypes = {

    labeled: LabeledEdge,

};

const defaultEdgeOptions = {

    type: "labeled",

};

const DEFAULT_LABELS: Record<string, string> = {

    service: "New Service",

};

export default function Diagram() {

    const { interviewId } = useParams();

    const [nodes, setNodes, onNodesChange] = useNodesState([]);

    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    const rfInstance = useRef<ReactFlowInstance | null>(null);

    const restored = useRef(false);

    const onConnect = useCallback(

        (params: Connection) =>

            setEdges((eds) =>

                addEdge(

                    {

                        ...params,

                        type: "labeled",

                        data: { label: "" },

                    },

                    eds

                )

            ),

        []

    );

    const onDrop = useCallback(

        (event: React.DragEvent) => {

            event.preventDefault();

            const type =

                event.dataTransfer.getData(

                    "application/reactflow"

                );

            if (!type || !rfInstance.current)

                return;

            const position =

                rfInstance.current.screenToFlowPosition({

                    x: event.clientX,

                    y: event.clientY

                });

            setNodes((nds) => [

                ...nds,

                {

                    id: `${type}_${Date.now()}`,

                    type,

                    position,

                    data: {

                        label: DEFAULT_LABELS[type] ?? type

                    }

                }

            ]);

        },

        []

    );

    const onDragOver = (

        event: React.DragEvent

    ) => {

        event.preventDefault();

        event.dataTransfer.dropEffect = "move";

    };

    // =====================================================
    // Restore Graph
    // =====================================================

    useEffect(() => {

        if (!interviewId)

            return;

        async function loadGraph() {

            try {

                const state = await getInterviewState(interviewId!);

                if (state.graph) {

                    setNodes(

                        state.graph.nodes ?? []

                    );

                    setEdges(

                        state.graph.edges ?? []

                    );

                }

            }

            catch (err) {

                console.error(err);

            }

        }

        loadGraph();

    }, [

        interviewId,

        setNodes,

        setEdges

    ]);

    // =====================================================
    // Autosave Graph
    // =====================================================

    useEffect(() => {

        if (!interviewId)

            return;

        // Skip the first save after restoring
        if (!restored.current) {

            restored.current = true;

            return;

        }

        const timeout = setTimeout(async () => {

            try {

                await saveGraph(

                    interviewId,

                    {

                        nodes,

                        edges

                    }

                );

            }

            catch (err) {

                console.error(err);

            }

        }, 500);

        return () => clearTimeout(timeout);

    }, [

        nodes,

        edges,

        interviewId

    ]);

    return (

    <div className="flex h-full flex-col bg-[#09090B]">

        <DiagramHeader

            nodes={nodes.length}

        />

        <div className="flex flex-1 overflow-hidden">

            <Sidebar />

            <div className="flex-1">

                <ReactFlow

                    nodes={nodes}

                    edges={edges}

                    nodeTypes={nodeTypes}

                    edgeTypes={edgeTypes}

                    defaultEdgeOptions={defaultEdgeOptions}

                    onNodesChange={onNodesChange}

                    onEdgesChange={onEdgesChange}

                    onConnect={onConnect}

                    onDrop={onDrop}

                    onDragOver={onDragOver}

                    onInit={(rf) =>

                        rfInstance.current = rf

                    }

                    fitView

                >

                    <Controls />

                    <Background

                        gap={24}

                        size={1.4}

                        color="#24262b"

                    />

                </ReactFlow>

            </div>

        </div>

    </div>

);

}
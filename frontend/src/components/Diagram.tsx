import { memo, useCallback, useEffect, useReducer, useRef, useState, type DragEvent } from "react";
import { useParams } from "react-router-dom";
import ReactFlow, { Background, Controls, MiniMap, type Connection, type ReactFlowInstance, type NodeChange, type EdgeChange } from "reactflow";
import "reactflow/dist/style.css";
import Sidebar from "./ComponentSidebar";
import { SqlDbNode, NoSqlDbNode, GraphDBNode, VectorDBNode, TimeSeriesDBNode } from "../nodes/DbNode";
import { RedisCacheNode, MemCacheNode, LocalCacheNode } from "../nodes/CacheNode";
import { QueueNode, EventBusNode, KafkaNode, PublisherNode, SubscriberNode } from "../nodes/MsgNode";
import { CDNNode, DNSNode, FirewallNode, LBNode, ApiNode, ReverseProxyNode } from "../nodes/NetworkNodes";
import { ServiceNode, WorkerNode, CronJobNode } from "../nodes/ServiceNode";
import { BlobStorageNode, ObjStorageNode, FileStorageNode } from "../nodes/StorageNode";
import { ClientNode, AppNode, ThirdPartyNode } from "../nodes/ClientNode";
import { SearchEngineNode, ElasticSearchNode } from "../nodes/SearchNode";
import LabeledEdge from "./LabeledEdge";
import DiagramHeader from "./diagram/DiagramHeader";
import { NODE_CATALOG } from "./diagram/nodeCatalog";
import { documentReducer, initialDocument, vacantPosition } from "./diagram/document";
import { useGraphAutosave } from "./diagram/useGraphAutosave";
import { editableTarget, useRoom, type SaveStatus } from "./chat/room.context";
import { getInterviewState } from "../services/interviewState.service";
import { Button, Card, Dialog, Skeleton } from "./ui";
import { GitBranch, RefreshCw } from "lucide-react";

const nodeTypes = { default: ServiceNode, webclient: ClientNode, mobile: AppNode, thirdparty: ThirdPartyNode, apigateway: ApiNode, api: ApiNode, dns: DNSNode, firewall: FirewallNode, proxy: ReverseProxyNode, lb: LBNode, cdn: CDNNode, sqldb: SqlDbNode, nosqldb: NoSqlDbNode, graphdb: GraphDBNode, vectordb: VectorDBNode, timeseriesdb: TimeSeriesDBNode, redis: RedisCacheNode, memcache: MemCacheNode, localcache: LocalCacheNode, msgqueue: QueueNode, eventbus: EventBusNode, publisher: PublisherNode, subscribe: SubscriberNode, kafka: KafkaNode, searchengine: SearchEngineNode, elasticsearch: ElasticSearchNode, service: ServiceNode, cronjob: CronJobNode, worker: WorkerNode, blobstore: BlobStorageNode, filestore: FileStorageNode, objectstore: ObjStorageNode };
const edgeTypes = { labeled: LabeledEdge };
const defaultEdgeOptions = { type: "labeled" };
const grid: [number, number] = [16, 16];

function Diagram() {
    const { interviewId } = useParams();
    const room = useRoom();
    const loadInitial = room?.loadInitial, registerFlush = room?.registerFlush, roomSave = room?.setSaveStatus;
    const [state, dispatch] = useReducer(documentReducer, initialDocument);
    const [failure, setFailure] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [palette, setPalette] = useState(false);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");
    const canvas = useRef<HTMLDivElement>(null);
    const flow = useRef<ReactFlowInstance | null>(null);
    const currentGraph = useRef(state.graph);
    useEffect(() => { currentGraph.current = state.graph; }, [state.graph]);
    const setStatus = useCallback((status: SaveStatus) => { setSaveStatus(status); roomSave?.(status); }, [roomSave]);
    const flush = useGraphAutosave(interviewId, state.graph, state.revision, state.loaded, setStatus);
    useEffect(() => registerFlush?.(flush), [registerFlush, flush]);
    useEffect(() => {
        if (!interviewId) return;
        let active = true;
        (loadInitial ? loadInitial() : getInterviewState(interviewId)).then(snapshot => {
            if (!active) return;
            dispatch({ type: "restore", graph: { nodes: snapshot.graph?.nodes ?? [], edges: snapshot.graph?.edges ?? [] } });
            setFailure(false);
        }).catch(() => { if (active) setFailure(true); });
        return () => { active = false; };
    }, [interviewId, attempt, loadInitial]);
    const add = useCallback((type: string, point?: { x: number; y: number }) => {
        if (!state.loaded || !Object.hasOwn(NODE_CATALOG, type)) return;
        const bounds = canvas.current?.getBoundingClientRect();
        const center = flow.current?.screenToFlowPosition(point ?? { x: (bounds?.left ?? 0) + (bounds?.width ?? 400) / 2, y: (bounds?.top ?? 0) + (bounds?.height ?? 400) / 2 }) ?? { x: 0, y: 0 };
        const position = point ? center : vacantPosition({ x: center.x - 96, y: center.y - 48 }, currentGraph.current.nodes);
        dispatch({ type: "add", node: { id: `${type}_${crypto.randomUUID()}`, type, position: { x: Math.round(position.x / 16) * 16, y: Math.round(position.y / 16) * 16 }, data: { label: NODE_CATALOG[type].label } } });
        if (room?.compact) setPalette(false);
    }, [state.loaded, room?.compact]);
    const drop = useCallback((event: DragEvent) => { event.preventDefault(); add(event.dataTransfer.getData("application/reactflow"), { x: event.clientX, y: event.clientY }); }, [add]);
    const connect = useCallback((connection: Connection) => dispatch({ type: "connect", connection }), []);
    const nodesChanged = useCallback((changes: NodeChange[]) => dispatch({ type: "nodes", changes }), []);
    const edgesChanged = useCallback((changes: EdgeChange[]) => dispatch({ type: "edges", changes }), []);
    const dragStart = useCallback(() => dispatch({ type: "drag-start" }), []);
    const dragStop = useCallback(() => dispatch({ type: "drag-stop" }), []);
    useEffect(() => {
        function keys(event: KeyboardEvent) {
            if (!state.loaded || editableTarget(event.target) || (event.target instanceof Element && event.target.closest("dialog"))) return;
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); dispatch({ type: event.shiftKey ? "redo" : "undo" }); }
            if (event.key === "Delete" && event.target instanceof Element && event.target.closest(".room-canvas")) { event.preventDefault(); dispatch({ type: "delete" }); }
        }
        document.addEventListener("keydown", keys); return () => document.removeEventListener("keydown", keys);
    }, [state.loaded]);
    return <section className="flex h-full min-h-0 min-w-0 flex-col bg-bg" aria-label="Architecture whiteboard">
        <DiagramHeader nodes={state.graph.nodes.length} edges={state.graph.edges.length} canUndo={Boolean(state.past.length)} canRedo={Boolean(state.future.length)} onUndo={() => dispatch({ type: "undo" })} onRedo={() => dispatch({ type: "redo" })} paletteOpen={palette} onPalette={() => setPalette(value => !value)} fullscreen={room?.fullscreen} onFullscreen={room?.toggleFullscreen} onHelp={room?.showHelp} />
        {saveStatus === "error" && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 border-b border-danger/30 bg-danger/5 px-4 py-2"><p className="text-xs text-danger">Your latest diagram changes haven’t saved yet.</p><Button size="sm" variant="secondary" onClick={() => void flush().catch(() => {})}>Retry save</Button></div>}
        <div className="flex min-h-0 flex-1">{palette && !room?.compact && <div className="w-44 shrink-0 border-r border-border xl:w-48"><Sidebar onAdd={add} disabled={!state.loaded} /></div>}
            <div ref={canvas} className="room-canvas relative min-h-0 min-w-0 flex-1" tabIndex={0} aria-label="Diagram canvas">
                {!state.loaded ? failure ? <div className="flex h-full items-center justify-center p-6"><Card role="alert" className="max-w-sm p-6"><h3 className="text-h4">Your diagram couldn’t load.</h3><p className="my-4 text-sm text-muted">Retry before editing so your saved work stays safe.</p><Button variant="secondary" onClick={() => { setFailure(false); setAttempt(value => value + 1); }}><RefreshCw size={14} aria-hidden="true" />Retry diagram</Button></Card></div> : <div role="status" aria-label="Loading diagram" className="space-y-5 p-8"><Skeleton className="h-24 w-44" /><Skeleton className="ml-24 h-24 w-44" /></div>
                    : <ReactFlow nodes={state.graph.nodes} edges={state.graph.edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} defaultEdgeOptions={defaultEdgeOptions} onNodesChange={nodesChanged} onEdgesChange={edgesChanged} onConnect={connect} onDrop={drop} onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; }} onInit={instance => { flow.current = instance; }} onNodeDragStart={dragStart} onNodeDragStop={dragStop} snapToGrid snapGrid={grid} deleteKeyCode={null} onlyRenderVisibleElements fitView minZoom={0.2} maxZoom={2} selectionOnDrag panOnDrag={[1, 2]}>
                        <Controls showInteractive={false} /><MiniMap nodeColor="rgb(var(--color-elevated))" nodeStrokeColor="rgb(var(--color-accent) / .45)" nodeBorderRadius={6} maskColor="rgb(var(--color-bg) / .75)" pannable zoomable /><Background gap={16} size={1} color="rgb(var(--color-border))" />
                    </ReactFlow>}
                {state.loaded && !state.graph.nodes.length && <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-5"><div className="max-w-xs text-center"><GitBranch size={34} strokeWidth={1} className="mx-auto mb-4 text-accent" aria-hidden="true" /><h3 className="text-base font-medium">A blank canvas. A clear start.</h3><p className="mt-2 text-xs leading-relaxed text-muted">Add a component, connect the pieces, and explain the choices behind them.</p><Button variant="secondary" size="sm" className="pointer-events-auto mt-5" onClick={() => add("webclient")}>Add a client</Button></div></div>}
            </div>
        </div>
        {room?.compact && <Dialog open={palette} onClose={() => setPalette(false)} title="Add a component" description="Tap a component to place it on your canvas."><div className="h-[50dvh]"><Sidebar onAdd={add} disabled={!state.loaded} /></div></Dialog>}
    </section>;
}
export default memo(Diagram);

import { memo, useEffect, useRef } from "react";
import ReactFlow, { Background, BaseEdge, Controls, EdgeLabelRenderer, getBezierPath, Handle, Position, type EdgeProps, type NodeProps, type ReactFlowInstance } from "reactflow";
import "reactflow/dist/style.css";
import { Card, CodeChip } from "../ui";
import { NODE_CATALOG } from "../diagram/nodeCatalog";
import type { DiagramSnapshot } from "./report.model";

const SnapshotNode = memo(function SnapshotNode({ data }: NodeProps<{ label: string; kind: string; subtype: string }>) {
    const definition = NODE_CATALOG[data.kind === "api" ? "apigateway" : data.kind] ?? NODE_CATALOG.service;
    const Icon = definition.icon;
    return <Card className="report-snapshot-node !w-44 !p-3"><Handle type="target" position={Position.Left} isConnectable={false} /><div className="flex items-center gap-2"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control border border-accent/20 bg-accent/10 text-accent"><Icon size={14} aria-hidden="true" /></span><span className="font-mono text-[8px] uppercase tracking-wider text-muted">{definition.category}</span></div><p className="mt-3 break-words text-xs font-medium">{data.label}</p>{data.subtype && <p className="mt-1 break-words font-mono text-[9px] text-muted">{data.subtype}</p>}<Handle type="source" position={Position.Right} isConnectable={false} /></Card>;
});
const SnapshotEdge = memo(function SnapshotEdge(props: EdgeProps<{ label: string }>) {
    const [path, x, y] = getBezierPath(props);
    return <><BaseEdge path={path} markerEnd={props.markerEnd} style={{ stroke: "rgb(var(--color-muted) / .7)", strokeWidth: 1.3 }} />{props.data?.label && <EdgeLabelRenderer><div style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}><CodeChip className="!px-1.5 !py-0.5 !text-[8px]">{props.data.label}</CodeChip></div></EdgeLabelRenderer>}</>;
});
const nodeTypes = { snapshot: SnapshotNode }, edgeTypes = { snapshot: SnapshotEdge };
export default function ReportCanvas({ nodes, edges }: Pick<DiagramSnapshot, "nodes" | "edges">) {
    const flow = useRef<ReactFlowInstance | null>(null);
    useEffect(() => {
        const fit = () => { void flow.current?.fitView({ duration: 0, padding: 0.2, maxZoom: 1.2 }); };
        window.addEventListener("beforeprint", fit); window.addEventListener("afterprint", fit);
        return () => { window.removeEventListener("beforeprint", fit); window.removeEventListener("afterprint", fit); };
    }, []);
    return <div className="h-[340px] sm:h-[420px]" aria-label="Final whiteboard, read only"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} nodesFocusable={false} edgesFocusable={false} edgesUpdatable={false} connectOnClick={false} deleteKeyCode={null} panActivationKeyCode={null} selectionKeyCode={null} multiSelectionKeyCode={null} zoomActivationKeyCode={null} zoomOnScroll={false} preventScrolling={false} zoomOnDoubleClick={false} fitView fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }} minZoom={0.05} maxZoom={2} onInit={instance => { flow.current = instance; }}>
                <Controls showInteractive={false} className="report-no-print" /><Background gap={20} size={1} color="rgb(var(--color-border))" />
            </ReactFlow></div>;
}

import { memo, useEffect, useRef, useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from "reactflow";
import { Button, Input } from "./ui";

function LabeledEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style, markerEnd, data, selected }: EdgeProps<{ label?: string }>) {
    const { setEdges } = useReactFlow();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState("");
    const input = useRef<HTMLInputElement>(null);
    const cancelled = useRef(false);
    const [path, x, y] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
    useEffect(() => { if (editing) { input.current?.focus(); input.current?.select(); } }, [editing]);
    function edit() { cancelled.current = false; setDraft(data?.label ?? ""); setEditing(true); }
    function commit() {
        if (cancelled.current) return;
        setEditing(false);
        const label = draft.trim();
        if (label !== (data?.label ?? "")) setEdges(edges => edges.map(edge => edge.id === id ? { ...edge, data: { ...edge.data, label } } : edge));
    }
    return <><g className="room-flowing-edge"><BaseEdge id={id} path={path} markerEnd={markerEnd} style={{ ...style, stroke: selected ? "rgb(var(--color-accent))" : "rgb(var(--color-muted) / .65)", strokeWidth: selected ? 2 : 1.3 }} /></g><EdgeLabelRenderer><div style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`, pointerEvents: "all" }} className="nodrag nopan" onDoubleClick={edit}>
        {editing ? <Input ref={input} aria-label="Connection label" value={draft} maxLength={100} onChange={event => setDraft(event.target.value)} onBlur={commit} className="!min-h-8 !w-36 !px-2 !py-1 !font-mono !text-[10px]" onKeyDown={event => { event.stopPropagation(); if (event.key === "Enter") commit(); if (event.key === "Escape") { cancelled.current = true; setEditing(false); } }} />
            : <Button variant="secondary" size="sm" aria-label={`Edit connection label${data?.label ? ": " + data.label : ""}`} className={`!min-h-6 !rounded-control !bg-surface !px-2 !py-1 !font-mono !text-[9px] ${data?.label ? "" : "opacity-0 hover:opacity-100 focus:opacity-100"}`} onClick={edit}>{data?.label || "+ label"}</Button>}
    </div></EdgeLabelRenderer></>;
}
export default memo(LabeledEdge);

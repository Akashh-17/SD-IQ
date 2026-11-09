import { useEffect, useRef, useState } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "reactflow";
import { Pencil } from "lucide-react";
import { Button, Card, Input } from "../components/ui";
import { NODE_CATALOG } from "../components/diagram/nodeCatalog";
import { labelKey, useRoom } from "../components/chat/room.context";

export interface SystemNodeData { label?: string; subtype?: string; }
export default function SystemNode({ id, data, selected, isConnectable, kind }: NodeProps<SystemNodeData> & { kind: string }) {
    const definition = NODE_CATALOG[kind] ?? NODE_CATALOG.service;
    const Icon = definition.icon;
    const label = data.label || definition.label;
    const { setNodes } = useReactFlow();
    const room = useRoom();
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(label);
    const input = useRef<HTMLInputElement>(null);
    const cancelled = useRef(false);
    useEffect(() => { if (editing) { input.current?.focus(); input.current?.select(); } }, [editing]);
    function rename() { cancelled.current = false; setDraft(label); setEditing(true); }
    function commit() {
        if (cancelled.current) return;
        const next = draft.trim() || definition.label;
        setEditing(false);
        if (next !== label) setNodes(nodes => nodes.map(node => node.id === id ? { ...node, data: { ...node.data, label: next } } : node));
    }
    const referenced = room?.references.includes(labelKey(label));
    return <Card className={`room-node group ${selected ? "room-node-selected" : ""} ${referenced ? "room-node-referenced" : ""}`} onDoubleClick={rename}>
        <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
        <div className="flex items-center justify-between gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-control border border-accent/20 bg-accent/10 text-accent"><Icon size={16} strokeWidth={1.5} aria-hidden="true" /></span><span className="font-mono text-[8px] uppercase tracking-[0.1em] text-muted">{definition.category}</span><Button variant="ghost" size="icon" aria-label={`Rename ${label}`} className="nodrag nopan !h-6 !w-6 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100" onClick={rename}><Pencil size={11} aria-hidden="true" /></Button></div>
        {editing ? <Input ref={input} aria-label="Component name" value={draft} maxLength={100} className="nodrag nopan mt-3 !min-h-8 !px-2 !py-1 !text-xs" onChange={event => setDraft(event.target.value)} onBlur={commit} onKeyDown={event => { event.stopPropagation(); if (event.key === "Enter") commit(); if (event.key === "Escape") { cancelled.current = true; setEditing(false); } }} /> : <p className="mt-3 max-w-[170px] break-words text-xs font-medium">{label}</p>}
        {data.subtype && <p className="mt-1 font-mono text-[9px] text-muted">{data.subtype}</p>}
        {referenced && <span className="sr-only">Referenced by the interviewer</span>}
        <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
    </Card>;
}

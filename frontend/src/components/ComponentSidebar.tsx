import { useMemo, useState } from "react";
import { GripVertical, Search } from "lucide-react";
import { Button, Input } from "./ui";
import { NODE_CATALOG } from "./diagram/nodeCatalog";

export default function ComponentSidebar({ onAdd, disabled = false }: { onAdd?: (type: string) => void; disabled?: boolean }) {
    const [query, setQuery] = useState("");
    const categories = useMemo(() => {
        const filtered = Object.entries(NODE_CATALOG).filter(([type, item]) => `${type} ${item.label} ${item.category}`.toLowerCase().includes(query.trim().toLowerCase()));
        return [...new Set(filtered.map(([, item]) => item.category))].map(name => ({ name, items: filtered.filter(([, item]) => item.category === name) }));
    }, [query]);
    return <aside className="flex h-full min-h-0 flex-col bg-surface" aria-label="Component palette">
        <div className="border-b border-border p-3"><Input label="Find a component" icon={Search} placeholder="Search components…" value={query} onChange={event => setQuery(event.target.value)} className="!min-h-10 !py-2 !text-xs" /></div>
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-3">{categories.map(category => <section key={category.name}><h3 className="mb-2 px-2 font-mono text-[9px] uppercase tracking-[0.12em] text-muted">{category.name}</h3><div className="space-y-1">{category.items.map(([type, { label, icon: Icon }]) => <Button key={type} variant="ghost" fullWidth disabled={disabled} draggable={!disabled} aria-label={`Add ${label}`} className="!min-h-10 !justify-start !rounded-control !px-2.5 !py-2 !text-[11px]" onClick={() => onAdd?.(type)} onDragStart={event => { event.dataTransfer.setData("application/reactflow", type); event.dataTransfer.effectAllowed = "move"; }}><Icon size={15} className="shrink-0 text-accent" aria-hidden="true" /><span className="flex-1 text-left">{label}</span><GripVertical size={12} className="text-muted/60" aria-hidden="true" /></Button>)}</div></section>)}{!categories.length && <p className="px-2 py-4 text-xs text-muted">No components match that search.</p>}</div>
        <p className="border-t border-border px-4 py-3 font-mono text-[9px] leading-relaxed text-muted">Drag to place. Click to add.<br />Double-click a node to rename.</p>
    </aside>;
}

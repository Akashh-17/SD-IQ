import { Boxes, Maximize2, Minimize2, PanelLeft, Redo2, Undo2, HelpCircle } from "lucide-react";
import { Button, Tooltip } from "../ui";

interface Props { nodes: number; edges: number; canUndo: boolean; canRedo: boolean; onUndo: () => void; onRedo: () => void; paletteOpen: boolean; onPalette: () => void; fullscreen?: boolean; onFullscreen?: () => void; onHelp?: () => void; }
export default function DiagramHeader({ nodes, edges, canUndo, canRedo, onUndo, onRedo, paletteOpen, onPalette, fullscreen, onFullscreen, onHelp }: Props) {
    return <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2">
        <div className="flex items-center gap-2"><Boxes size={15} className="text-accent" aria-hidden="true" /><h2 className="sr-only text-xs font-medium sm:not-sr-only">Architecture</h2><span className="font-mono text-[9px] text-muted">{nodes} nodes <span className="hidden sm:inline">/ {edges} edges</span></span></div>
        <div className="flex items-center gap-1"><Tooltip content={paletteOpen ? "Hide component palette" : "Add components"}><Button variant="ghost" size="icon" className="!h-8 !w-8" aria-label="Toggle component palette" aria-expanded={paletteOpen} onClick={onPalette}><PanelLeft size={14} aria-hidden="true" /></Button></Tooltip>
            <Tooltip content="Undo · Ctrl/⌘ Z"><Button variant="ghost" size="icon" className="!h-8 !w-8" aria-label="Undo diagram edit" disabled={!canUndo} onClick={onUndo}><Undo2 size={14} aria-hidden="true" /></Button></Tooltip>
            <Tooltip content="Redo · Ctrl/⌘ Shift Z"><Button variant="ghost" size="icon" className="!h-8 !w-8" aria-label="Redo diagram edit" disabled={!canRedo} onClick={onRedo}><Redo2 size={14} aria-hidden="true" /></Button></Tooltip>
            {onFullscreen && <Tooltip content={fullscreen ? "Restore split view" : "Full-screen whiteboard"}><Button variant="ghost" size="icon" className="!h-8 !w-8" aria-label={fullscreen ? "Restore split view" : "Full-screen whiteboard"} aria-pressed={fullscreen} onClick={onFullscreen}>{fullscreen ? <Minimize2 size={14} aria-hidden="true" /> : <Maximize2 size={14} aria-hidden="true" />}</Button></Tooltip>}
            {onHelp && <Button variant="ghost" size="icon" className="!h-8 !w-8" aria-label="Keyboard shortcuts" onClick={onHelp}><HelpCircle size={14} aria-hidden="true" /></Button>}
        </div>
    </header>;
}

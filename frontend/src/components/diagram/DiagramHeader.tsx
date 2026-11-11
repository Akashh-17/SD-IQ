import { Boxes, FileImage, FileCode2, Maximize2, Minimize2, PanelLeft, HelpCircle } from "lucide-react";
import { Button, Tooltip } from "../ui";

// Undo/redo live in Excalidraw's own toolbar (and Ctrl/⌘ Z).
interface Props { nodes: number; edges: number; paletteOpen: boolean; onPalette: () => void; onExport?: (kind: "png" | "svg") => void; fullscreen?: boolean; onFullscreen?: () => void; onHelp?: () => void; }
export default function DiagramHeader({ nodes, edges, paletteOpen, onPalette, onExport, fullscreen, onFullscreen, onHelp }: Props) {
    return <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-3 py-2">
        <div className="flex items-center gap-2"><Boxes size={15} className="text-accent" aria-hidden="true" /><h2 className="sr-only text-xs font-medium sm:not-sr-only">Architecture</h2><span className="font-mono text-[9px] text-muted">{nodes} components <span className="hidden sm:inline">/ {edges} connections</span></span></div>
        <div className="flex items-center gap-1"><Tooltip content={paletteOpen ? "Hide component palette" : "Add components"}><Button variant="ghost" size="icon" className="!h-8 !w-8" aria-label="Toggle component palette" aria-expanded={paletteOpen} onClick={onPalette}><PanelLeft size={14} aria-hidden="true" /></Button></Tooltip>
            <Tooltip content="Export PNG"><Button variant="ghost" size="icon" className="!h-8 !w-8" aria-label="Export whiteboard as PNG" disabled={!onExport} onClick={() => onExport?.("png")}><FileImage size={14} aria-hidden="true" /></Button></Tooltip>
            <Tooltip content="Export SVG"><Button variant="ghost" size="icon" className="!h-8 !w-8" aria-label="Export whiteboard as SVG" disabled={!onExport} onClick={() => onExport?.("svg")}><FileCode2 size={14} aria-hidden="true" /></Button></Tooltip>
            {onFullscreen && <Tooltip content={fullscreen ? "Restore split view" : "Full-screen whiteboard"}><Button variant="ghost" size="icon" className="!h-8 !w-8" aria-label={fullscreen ? "Restore split view" : "Full-screen whiteboard"} aria-pressed={fullscreen} onClick={onFullscreen}>{fullscreen ? <Minimize2 size={14} aria-hidden="true" /> : <Maximize2 size={14} aria-hidden="true" />}</Button></Tooltip>}
            {onHelp && <Button variant="ghost" size="icon" className="!h-8 !w-8" aria-label="Keyboard shortcuts" onClick={onHelp}><HelpCircle size={14} aria-hidden="true" /></Button>}
        </div>
    </header>;
}

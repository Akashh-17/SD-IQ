import { memo, useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { useParams } from "react-router-dom";
import { CaptureUpdateAction, Excalidraw, MIME_TYPES, exportToBlob, exportToSvg, serializeLibraryAsJSON } from "@excalidraw/excalidraw";
import type { ExcalidrawElement, NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { ExcalidrawImperativeAPI, ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";
import "@excalidraw/excalidraw/index.css";
import Sidebar from "./ComponentSidebar";
import DiagramHeader from "./diagram/DiagramHeader";
import { useGraphAutosave, type WhiteboardDocument } from "./diagram/useGraphAutosave";
import { NODE_CATALOG } from "./diagram/nodeCatalog";
import { labelKey, useRoom, type SaveStatus } from "./chat/room.context";
import { getInterviewState } from "../services/interviewState.service";
import { sceneToGraph, sceneVersion } from "./excalidraw/converter";
import { COMPONENT_SIZE, componentElements } from "./excalidraw/factory";
import { iconFileMap } from "./excalidraw/icons";
import { componentLibrary, initialElements, toExcalidraw, setExcalidrawAssetPath } from "./excalidraw/scene";
import type { SceneElement } from "./excalidraw/types";
import { Button, Card, Dialog, Skeleton } from "./ui";
import { GitBranch, RefreshCw } from "lucide-react";
import "./excalidraw/whiteboard.css";

setExcalidrawAssetPath();

const EMPTY: WhiteboardDocument = { nodes: [], edges: [], scene: { elements: [] } };
// Light-space colours (Excalidraw's dark mode inverts the canvas)
const APP_STATE = { viewBackgroundColor: "#ffffff", currentItemFontFamily: 5, currentItemStrokeColor: "#1e1e1e", currentItemRoughness: 1, gridSize: 16 } as const;
const UI_OPTIONS = { tools: { image: false }, canvasActions: { loadScene: false, saveToActiveFile: false, toggleTheme: false, changeViewBackgroundColor: false, export: false as const, saveAsImage: true, clearCanvas: true } };

function documentFor(elements: readonly ExcalidrawElement[]): WhiteboardDocument {
    const live = elements.filter(element => !element.isDeleted) as unknown as SceneElement[];
    return { ...sceneToGraph(live), scene: { elements: live } };
}

function download(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement("a"), { href: url, download: name });
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Diagram() {
    const { interviewId } = useParams();
    const room = useRoom();
    const loadInitial = room?.loadInitial, registerFlush = room?.registerFlush, roomSave = room?.setSaveStatus;
    const [initial, setInitial] = useState<ExcalidrawInitialDataState | null>(null);
    const [doc, setDoc] = useState({ graph: EMPTY, revision: 0 });
    const [failure, setFailure] = useState(false);
    const [attempt, setAttempt] = useState(0);
    const [palette, setPalette] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null);
    const version = useRef<number | null>(null);
    const highlighted = useRef(false);
    const setStatus = useCallback((status: SaveStatus) => { roomSave?.(status); }, [roomSave]);
    const loaded = initial !== null;
    const flush = useGraphAutosave(interviewId, doc.graph, doc.revision, loaded, setStatus);
    useEffect(() => registerFlush?.(flush), [registerFlush, flush]);

    // Load the saved drawing (or rebuild an old React Flow diagram)
    useEffect(() => {
        if (!interviewId) return;
        let active = true;
        (loadInitial ? loadInitial() : getInterviewState(interviewId)).then(snapshot => {
            if (!active) return;
            const elements = initialElements(snapshot.scene, snapshot.graph);
            version.current = sceneVersion(elements as unknown as SceneElement[]);
            setDoc({ graph: documentFor(elements), revision: 0 });
            setInitial({ elements, files: iconFileMap(), libraryItems: componentLibrary(), appState: APP_STATE, scrollToContent: true });
            setFailure(false);
        }).catch(() => { if (active) setFailure(true); });
        return () => { active = false; };
    }, [interviewId, attempt, loadInitial]);

    // Every drawing change bumps the revision; autosave debounces the saves
    const change = useCallback((elements: readonly ExcalidrawElement[]) => {
        const next = sceneVersion(elements as unknown as SceneElement[]);
        if (next === version.current) return;
        version.current = next;
        setDoc(previous => ({ graph: documentFor(elements), revision: previous.revision + 1 }));
    }, []);

    // Click to add: place the component in the first free slot of a grid that
    // starts at the middle of the visible canvas, so additions never overlap
    const add = useCallback((type: string) => {
        if (!api || !Object.hasOwn(NODE_CATALOG, type)) return;
        const state = api.getAppState();
        const zoom = state.zoom.value;
        const { width, height } = COMPONENT_SIZE, gap = 56;
        const origin = { x: state.width / 2 / zoom - state.scrollX - width / 2, y: state.height / 2 / zoom - state.scrollY - height / 2 };
        const existing = api.getSceneElements();
        const free = (x: number, y: number) => existing.every(element => x + width + 16 <= element.x || x >= element.x + element.width + 16 || y + height + 16 <= element.y || y >= element.y + element.height + 16);
        let slot = origin;
        for (let index = 0; index < 64; index++) {
            const candidate = { x: origin.x + (index % 4) * (width + gap), y: origin.y + Math.floor(index / 4) * (height + gap) };
            if (free(candidate.x, candidate.y)) { slot = candidate; break; }
        }
        const added = toExcalidraw(componentElements(type, { x: Math.round(slot.x), y: Math.round(slot.y) }));
        api.updateScene({ elements: [...api.getSceneElementsIncludingDeleted(), ...added], appState: { selectedElementIds: { [added[0].id]: true } }, captureUpdate: CaptureUpdateAction.IMMEDIATELY });
        if (room?.compact) setPalette(false);
    }, [api, room?.compact]);

    // Drag to add: Excalidraw drops library items at the pointer
    const dragStart = useCallback((type: string, event: DragEvent) => {
        const item = componentLibrary().find(entry => entry.id === `systemiq-${type}`);
        if (!item) return;
        event.dataTransfer.setData(MIME_TYPES.excalidrawlib, serializeLibraryAsJSON([item]));
        event.dataTransfer.effectAllowed = "copy";
    }, []);

    // Briefly select components the interviewer just mentioned (re-runs only
    // when the references change, not on every drawing edit)
    const nodes = useRef(doc.graph.nodes);
    useEffect(() => { nodes.current = doc.graph.nodes; }, [doc.graph.nodes]);
    const references = room?.references;
    useEffect(() => {
        if (!api) return;
        const ids = (references ?? []).length ? nodes.current.filter(node => references?.includes(labelKey(node.data.label))).map(node => node.id) : [];
        if (!ids.length && !highlighted.current) return;
        highlighted.current = ids.length > 0;
        api.updateScene({ appState: { selectedElementIds: Object.fromEntries(ids.map(id => [id, true])) }, captureUpdate: CaptureUpdateAction.NEVER });
    }, [api, references]);

    const exportImage = useCallback(async (kind: "png" | "svg") => {
        if (!api) return;
        const elements = api.getSceneElements() as NonDeletedExcalidrawElement[];
        if (!elements.length) return;
        setExporting(true);
        try {
            const options = { elements, files: api.getFiles(), appState: { ...api.getAppState(), exportBackground: true, exportWithDarkMode: true, exportEmbedScene: false } };
            const blob = kind === "png"
                ? await exportToBlob({ ...options, mimeType: "image/png" })
                : new Blob([(await exportToSvg(options)).outerHTML], { type: "image/svg+xml" });
            download(blob, `systemiq-whiteboard.${kind}`);
        }
        finally { setExporting(false); }
    }, [api]);

    const canExport = Boolean(api) && Boolean(doc.graph.scene?.elements.length);
    return <section className="flex h-full min-h-0 min-w-0 flex-col bg-bg" aria-label="Architecture whiteboard">
        <DiagramHeader nodes={doc.graph.nodes.length} edges={doc.graph.edges.length} paletteOpen={palette} onPalette={() => setPalette(value => !value)} onExport={canExport && !exporting ? kind => void exportImage(kind) : undefined} fullscreen={room?.fullscreen} onFullscreen={room?.toggleFullscreen} onHelp={room?.showHelp} />
        {room?.saveStatus === "error" && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 border-b border-danger/30 bg-danger/5 px-4 py-2"><p className="text-xs text-danger">Your latest diagram changes haven’t saved yet.</p><Button size="sm" variant="secondary" onClick={() => void flush().catch(() => {})}>Retry save</Button></div>}
        <div className="flex min-h-0 flex-1">{palette && !room?.compact && <div className="w-44 shrink-0 border-r border-border xl:w-48"><Sidebar onAdd={add} onDragStart={dragStart} disabled={!api} /></div>}
            <div className="room-canvas relative min-h-0 min-w-0 flex-1" aria-label="Diagram canvas">
                {!loaded ? failure ? <div className="flex h-full items-center justify-center p-6"><Card role="alert" className="max-w-sm p-6"><h3 className="text-h4">Your diagram couldn’t load.</h3><p className="my-4 text-sm text-muted">Retry before editing so your saved work stays safe.</p><Button variant="secondary" onClick={() => { setFailure(false); setAttempt(value => value + 1); }}><RefreshCw size={14} aria-hidden="true" />Retry diagram</Button></Card></div> : <div role="status" aria-label="Loading diagram" className="space-y-5 p-8"><Skeleton className="h-24 w-44" /><Skeleton className="ml-24 h-24 w-44" /></div>
                    : <div className="absolute inset-0"><Excalidraw excalidrawAPI={setApi} initialData={initial} onChange={change} theme="dark" UIOptions={UI_OPTIONS} name="SystemIQ whiteboard" /></div>}
                {loaded && !doc.graph.scene?.elements.length && <div className="pointer-events-none absolute inset-x-0 top-1/3 z-10 flex justify-center p-5"><div className="max-w-xs text-center"><GitBranch size={34} strokeWidth={1} className="mx-auto mb-4 text-accent" aria-hidden="true" /><h3 className="text-base font-medium">A blank canvas. A clear start.</h3><p className="mt-2 text-xs leading-relaxed text-muted">Add components, draw arrows between them, sketch zones and notes. Explain the choices behind them.</p><Button variant="secondary" size="sm" className="pointer-events-auto mt-5" disabled={!api} onClick={() => add("webclient")}>Add a client</Button></div></div>}
            </div>
        </div>
        {room?.compact && <Dialog open={palette} onClose={() => setPalette(false)} title="Add a component" description="Tap a component to place it on your canvas."><div className="h-[50dvh]"><Sidebar onAdd={add} disabled={!api} /></div></Dialog>}
    </section>;
}
export default memo(Diagram);

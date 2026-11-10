import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useParams } from "react-router-dom";
import { Group, Panel, Separator, useGroupRef, usePanelRef } from "react-resizable-panels";
import ChatPanel from "../components/ChatPanel";
import Topbar from "../components/InterviewTopbar";
import { Dialog, Kbd, Skeleton } from "../components/ui";
import { RoomContext, diagramReferences, editableTarget, sharedInitial, type RoomSnapshot, type SaveStatus } from "../components/chat/room.context";
import { getInterviewState } from "../services/interviewState.service";
import "../components/chat/interview-room.css";
const Diagram = lazy(() => import("../components/Diagram"));

const compactQuery = "(max-width: 900px)";
const subscribe = (callback: () => void) => { const media = window.matchMedia(compactQuery); media.addEventListener("change", callback); return () => media.removeEventListener("change", callback); };
const compactSnapshot = () => window.matchMedia(compactQuery).matches;

function InterviewRoom({ interviewId }: { interviewId: string }) {
    const compact = useSyncExternalStore(subscribe, compactSnapshot, () => false);
    const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
    const [saveStatus, setSaveStatus] = useState<SaveStatus>("loading");
    const [collapsed, setCollapsed] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [help, setHelp] = useState(false);
    const [references, setReferences] = useState<string[]>([]);
    const chat = usePanelRef();
    const panels = useGroupRef();
    const previousCompact = useRef(compact);
    const root = useRef<HTMLDivElement>(null);
    const flush = useRef<(() => Promise<void>) | null>(null);
    const previousCollapse = useRef(false);
    const alive = useRef(true);
    const highlight = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (previousCompact.current !== compact && (panels.current?.getLayout().conversation ?? 0) > 0) {
            panels.current?.setLayout({ whiteboard: compact ? 40 : 65, conversation: compact ? 60 : 35 });
        }
        previousCompact.current = compact;
    }, [compact, panels]);
    useEffect(() => { alive.current = true; return () => { alive.current = false; if (highlight.current) clearTimeout(highlight.current); }; }, []);
    const ingest = useCallback((data: RoomSnapshot) => setSnapshot(data), []);
    const fetchInitial = useCallback(async () => {
        const data = await getInterviewState(interviewId);
        ingest(data);
        return data;
    }, [interviewId, ingest]);
    const loadInitial = useMemo(() => sharedInitial<RoomSnapshot>(fetchInitial), [fetchInitial]);
    const refresh = useCallback(async () => {
        try { const data = await getInterviewState(interviewId); if (alive.current) setSnapshot(data); return data as RoomSnapshot; }
        catch { return null; }
    }, [interviewId]);
    const publishReply = useCallback((text: string, completed = false) => {
        if (highlight.current) clearTimeout(highlight.current);
        // Show Wrap-up as active, but remember the stage the candidate actually
        // reached so stages they never got to aren't checked off as done
        if (completed) { setSnapshot(previous => ({ ...previous, interview: { ...previous?.interview, stage: "Wrap-up", endedAtStage: previous?.interview?.endedAtStage ?? previous?.interview?.stage } })); setReferences([]); return; }
        void refresh().then(data => {
            if (!alive.current) return;
            setReferences(diagramReferences(text, data?.graph));
            highlight.current = setTimeout(() => { if (alive.current) setReferences([]); }, 2600);
        });
    }, [refresh]);
    const registerFlush = useCallback((callback: () => Promise<void>) => { flush.current = callback; return () => { if (flush.current === callback) flush.current = null; }; }, []);
    const flushGraph = useCallback(async () => { await flush.current?.(); }, []);
    const leaveFocus = useCallback(() => {
        setFullscreen(false);
        if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
        if (!previousCollapse.current) chat.current?.expand();
    }, [chat]);
    const toggleFullscreen = useCallback(() => {
        if (fullscreen) { leaveFocus(); return; }
        previousCollapse.current = Boolean(chat.current?.isCollapsed());
        chat.current?.collapse(); setFullscreen(true);
        if (root.current?.requestFullscreen) void root.current.requestFullscreen().catch(() => {});
    }, [fullscreen, leaveFocus, chat]);
    const toggleChat = useCallback(() => {
        if (fullscreen) { leaveFocus(); chat.current?.expand(); }
        else if (chat.current?.isCollapsed()) chat.current.expand();
        else chat.current?.collapse();
    }, [fullscreen, leaveFocus, chat]);
    const showHelp = useCallback(() => setHelp(true), []);
    useEffect(() => {
        function keys(event: KeyboardEvent) {
            if (editableTarget(event.target)) return;
            if (event.key === "?" && !(event.target instanceof Element && event.target.closest("dialog"))) { event.preventDefault(); setHelp(true); }
            if (event.key === "Escape" && fullscreen && !help) leaveFocus();
        }
        function changed() { if (!document.fullscreenElement && fullscreen) leaveFocus(); }
        document.addEventListener("keydown", keys); document.addEventListener("fullscreenchange", changed);
        return () => { document.removeEventListener("keydown", keys); document.removeEventListener("fullscreenchange", changed); };
    }, [fullscreen, help, leaveFocus]);
    const value = useMemo(() => ({ snapshot, ingest, loadInitial, refresh, publishReply, references, saveStatus, setSaveStatus, registerFlush, flushGraph, collapsed, toggleChat, fullscreen, toggleFullscreen, showHelp, compact }), [snapshot, ingest, loadInitial, refresh, publishReply, references, saveStatus, registerFlush, flushGraph, collapsed, toggleChat, fullscreen, toggleFullscreen, showHelp, compact]);
    return <RoomContext.Provider value={value}><div ref={root} role="main" aria-label="Interview room" className={`room-shell flex h-dvh min-h-0 flex-col overflow-hidden bg-bg text-text ${fullscreen ? "room-focus" : ""}`}>
        <Topbar />
        <Group id="interview-panels" groupRef={panels} orientation={compact ? "vertical" : "horizontal"} className="min-h-0 flex-1" resizeTargetMinimumSize={{ coarse: 24, fine: 12 }}>
            <Panel id="whiteboard" defaultSize={compact ? "40%" : "65%"} minSize={compact ? "25%" : "35%"} className="min-h-0 min-w-0"><Suspense fallback={<div role="status" aria-label="Loading diagram" className="h-full space-y-5 p-8"><Skeleton className="h-24 w-44" /><Skeleton className="ml-24 h-24 w-44" /></div>}><Diagram /></Suspense></Panel>
            <Separator disabled={collapsed} aria-label={compact ? "Resize whiteboard and chat vertically" : "Resize whiteboard and chat"} className={`room-separator ${compact ? "h-[5px] cursor-row-resize" : "w-[5px] cursor-col-resize"} ${collapsed ? "hidden" : ""}`} />
            <Panel id="conversation" panelRef={chat} defaultSize={compact ? "60%" : "35%"} minSize={compact ? "45%" : "26%"} collapsible collapsedSize="0%" onResize={size => setCollapsed(size.asPercentage < 0.1)} aria-hidden={collapsed} inert={collapsed} className="min-h-0 min-w-0 overflow-hidden"><ChatPanel /></Panel>
        </Group>
        <Dialog open={help} onClose={() => setHelp(false)} title="A few keys. More flow." description="Shortcuts work on the whiteboard. While typing, your normal text shortcuts stay intact.">
            <dl className="space-y-4 text-sm">{[{ label: "Send your answer", keys: ["Enter"] }, { label: "New line in chat", keys: ["Shift", "Enter"] }, { label: "Undo a diagram edit", keys: ["Ctrl / ⌘", "Z"] }, { label: "Redo a diagram edit", keys: ["Ctrl / ⌘", "Shift", "Z"] }, { label: "Delete selected nodes or edges", keys: ["Delete"] }, { label: "Rename a node", keys: ["Double-click"] }, { label: "Exit full-screen whiteboard", keys: ["Esc"] }, { label: "Show this help", keys: ["?"] }].map(item => <div key={item.label} className="flex flex-wrap items-center justify-between gap-3"><dt className="text-xs text-muted">{item.label}</dt><dd className="flex flex-wrap gap-1">{item.keys.map(key => <Kbd key={key}>{key}</Kbd>)}</dd></div>)}</dl>
        </Dialog>
    </div></RoomContext.Provider>;
}
export default function Interview() {
    const { interviewId } = useParams();
    return <InterviewRoom key={interviewId} interviewId={interviewId ?? ""} />;
}

import { useCallback, useEffect, useRef } from "react";
import { saveGraph } from "../../services/graph.service";
import type { Graph, StoredScene } from "../excalidraw/types";
import type { SaveStatus } from "../chat/room.context";

// What gets saved: the converted graph (for the AI) plus the full drawing
export type WhiteboardDocument = Graph & { scene?: StoredScene };

export function useGraphAutosave(id: string | undefined, graph: WhiteboardDocument, revision: number, loaded: boolean, onStatus: (status: SaveStatus) => void) {
    const latest = useRef({ graph, revision, loaded });
    const saved = useRef(0);
    const scheduled = useRef(0);
    const queue = useRef<Promise<void>>(Promise.resolve());
    const mounted = useRef(true);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => { latest.current = { graph, revision, loaded }; }, [graph, revision, loaded]);
    const flush = useCallback(async () => {
        if (timer.current) clearTimeout(timer.current);
        const current = latest.current;
        if (!id || !current.loaded || current.revision <= saved.current || current.revision <= scheduled.current) return queue.current;
        scheduled.current = current.revision;
        if (mounted.current) onStatus("saving");
        const next = queue.current.catch(() => {}).then(async () => {
            await saveGraph(id, current.graph);
            saved.current = current.revision;
            if (mounted.current && latest.current.revision === current.revision) onStatus("saved");
        }).catch(error => {
            if (scheduled.current === current.revision) scheduled.current = saved.current;
            if (mounted.current) onStatus("error");
            throw error;
        });
        queue.current = next;
        return next;
    }, [id, onStatus]);
    useEffect(() => {
        if (!loaded) return;
        if (revision === 0) { onStatus("saved"); return; }
        onStatus("saving");
        timer.current = setTimeout(() => { void flush().catch(() => {}); }, 500);
        return () => { if (timer.current) clearTimeout(timer.current); };
    }, [revision, loaded, flush, onStatus]);
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; void flush().catch(() => {}); };
    }, [flush]);
    return flush;
}

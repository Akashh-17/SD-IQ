import { restoreElements } from "@excalidraw/excalidraw";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import type { LibraryItems } from "@excalidraw/excalidraw/types";
import { NODE_CATALOG } from "../diagram/nodeCatalog";
import { componentElements, migrateLegacyGraph } from "./factory";
import type { SceneElement } from "./types";

// Runtime helpers that need Excalidraw itself (kept out of the pure modules).

// Asset path for Excalidraw's hand-drawn fonts, self-hosted in /public so the
// whiteboard keeps its look offline. Unknown fonts fall back to Excalidraw's CDN.
export function setExcalidrawAssetPath() {
    (window as Window & { EXCALIDRAW_ASSET_PATH?: string }).EXCALIDRAW_ASSET_PATH = `${window.location.origin}/excalidraw/`;
}

export function toExcalidraw(elements: SceneElement[]) {
    return restoreElements(elements as unknown as ExcalidrawElement[], null, { repairBindings: true });
}

// Saved drawing if there is one; otherwise an old React Flow diagram rebuilt
// as Excalidraw components (interviews saved before the switch).
export function initialElements(scene: { elements?: unknown[] } | null | undefined, legacy: { nodes?: unknown[]; edges?: unknown[] } | null | undefined) {
    const saved = Array.isArray(scene?.elements) ? scene.elements as SceneElement[] : null;
    return toExcalidraw(saved ?? migrateLegacyGraph(legacy));
}

let library: LibraryItems | null = null;
export function componentLibrary(): LibraryItems {
    library ??= Object.entries(NODE_CATALOG).map(([type, { label }]) => ({
        id: `systemiq-${type}`,
        status: "published" as const,
        name: label,
        created: 0,
        elements: toExcalidraw(componentElements(type, { x: 0, y: 0 }, { id: `lib-${type}` }))
    }));
    return library;
}

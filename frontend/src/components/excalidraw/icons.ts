import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type { BinaryFileData, DataURL } from "@excalidraw/excalidraw/types";
import type { FileId } from "@excalidraw/excalidraw/element/types";
import { NODE_CATALOG } from "../diagram/nodeCatalog";
import { COMPONENT_STYLE, iconFileId } from "./factory";

// The palette's lucide icons, rendered once to SVG and registered with
// Excalidraw as image files. Icon files are never saved with the drawing:
// they're rebuilt here on every load, so saved scenes stay small.
let cache: BinaryFileData[] | null = null;

function iconSvg(type: string) {
    const host = document.createElement("div");
    const root = createRoot(host);
    flushSync(() => root.render(createElement(NODE_CATALOG[type].icon, { size: 48, strokeWidth: 1.75, color: COMPONENT_STYLE.stroke })));
    const markup = host.innerHTML;
    root.unmount();
    return markup.includes("xmlns=") ? markup : markup.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
}

export function iconFiles(): BinaryFileData[] {
    cache ??= Object.keys(NODE_CATALOG).map(type => ({
        id: iconFileId(type) as FileId,
        mimeType: "image/svg+xml",
        dataURL: `data:image/svg+xml;base64,${btoa(iconSvg(type))}` as DataURL,
        created: 0
    }));
    return cache;
}

export function iconFileMap() {
    return Object.fromEntries(iconFiles().map(file => [file.id, file]));
}

import { useEffect, useRef, useState } from "react";
import { exportToSvg } from "@excalidraw/excalidraw";
import type { NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/element/types";
import { iconFileMap } from "../excalidraw/icons";
import { initialElements, setExcalidrawAssetPath } from "../excalidraw/scene";
import type { DiagramSnapshot } from "./report.model";
import { useTheme } from "../../theme/context";

setExcalidrawAssetPath();

// The final whiteboard as a static SVG (read only, prints cleanly).
// Old reports without a saved drawing are rebuilt from their components.
export default function ReportCanvas({ nodes, edges, scene }: Pick<DiagramSnapshot, "nodes" | "edges" | "scene">) {
    const { theme } = useTheme();
    const host = useRef<HTMLDivElement>(null);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        let active = true;
        const legacy = { nodes: nodes.map(node => ({ id: node.id, type: node.data.kind, position: node.position, data: { label: node.data.label } })), edges };
        const elements = initialElements(scene, legacy).filter(element => !element.isDeleted) as NonDeletedExcalidrawElement[];
        exportToSvg({ elements, files: iconFileMap(), appState: { exportBackground: true, exportWithDarkMode: theme === "dark", viewBackgroundColor: "#ffffff" }, exportPadding: 24 })
            .then((svg: SVGSVGElement) => {
                if (!active || !host.current) return;
                svg.removeAttribute("width"); svg.removeAttribute("height");
                svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
                svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "Final whiteboard");
                svg.classList.add("report-whiteboard-svg");
                host.current.replaceChildren(svg);
                host.current.dataset.ready = "true";
            })
            .catch(() => { if (active) setFailed(true); });
        return () => { active = false; };
    }, [nodes, edges, scene, theme]);
    return <div className="h-[340px] overflow-auto p-3 sm:h-[420px]" aria-label="Final whiteboard, read only">
        {failed ? <p role="alert" className="p-5 text-xs text-muted">The whiteboard couldn’t be drawn. The component list below is still available.</p> : <div ref={host} data-report-whiteboard className="flex h-full w-full items-center justify-center" />}
    </div>;
}

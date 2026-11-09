import { createElement, memo } from "react";
import type { NodeProps } from "reactflow";
import SystemNode, { type SystemNodeData } from "./SystemNode";

export function nodeFor(kind: string) {
    return memo(function DiagramNode(props: NodeProps<SystemNodeData>) {
        return createElement(SystemNode, { ...props, kind });
    }, (a, b) => a.id === b.id && a.data === b.data && a.selected === b.selected && a.isConnectable === b.isConnectable);
}

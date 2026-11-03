import type { Node, Edge } from "reactflow";

export type NodeType = "api" | "db" | "cache";

export interface CustomNodeData {
  label: string;
  subtype?: string;
}

export type FlowNode = Node<CustomNodeData>;
export type FlowEdge = Edge;
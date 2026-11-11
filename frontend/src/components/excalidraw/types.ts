// Structural subset of Excalidraw elements that the converter and factory use.
// Kept local (instead of importing Excalidraw's types) so this logic stays pure,
// unit-testable and out of the main bundle.
export interface SceneBinding { elementId: string; focus: number; gap: number; }
export interface SceneElement {
    id: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    isDeleted?: boolean;
    groupIds?: readonly string[];
    frameId?: string | null;
    boundElements?: readonly { id: string; type: string }[] | null;
    customData?: Record<string, unknown>;
    // text
    text?: string;
    originalText?: string;
    containerId?: string | null;
    // arrows
    startBinding?: SceneBinding | null;
    endBinding?: SceneBinding | null;
    // frames
    name?: string | null;
    [key: string]: unknown;
}

// The graph shape the backend already understands (/api/interview/graph).
export interface GraphNode { id: string; type: string; position: { x: number; y: number }; data: { label: string; group?: string } }
export interface GraphEdge { id: string; source: string; target: string; label: string; data: { label: string } }
export interface Graph { nodes: GraphNode[]; edges: GraphEdge[] }
export interface StoredScene { elements: SceneElement[] }

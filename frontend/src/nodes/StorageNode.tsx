import { Handle, Position } from "reactflow";

export function BlobStorageNode() {
  return (
    <div className="px-3 py-2 bg-indigo-950 border-2 border-indigo-500 rounded-lg text-indigo-200 text-xs font-medium shadow-lg shadow-indigo-900/30">
      ☁️ Blob Storage
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function ObjStorageNode() {
  return (
    <div className="px-3 py-2 bg-indigo-950 border-2 border-indigo-500 rounded-lg text-indigo-200 text-xs font-medium shadow-lg shadow-indigo-900/30">
      🪣 Object Storage
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function FileStorageNode() {
  return (
    <div className="px-3 py-2 bg-indigo-950 border-2 border-indigo-500 rounded-lg text-indigo-200 text-xs font-medium shadow-lg shadow-indigo-900/30">
      🗃️ File Storage
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
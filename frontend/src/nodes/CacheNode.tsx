import { Handle, Position } from "reactflow";

export function RedisCacheNode() {
  return (
    <div className="px-3 py-2 bg-yellow-950 border-2 border-yellow-500 rounded-lg text-yellow-200 text-xs font-medium shadow-lg shadow-yellow-900/30">
      ⚡ Redis Cache
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function MemCacheNode() {
  return (
    <div className="px-3 py-2 bg-yellow-950 border-2 border-yellow-500 rounded-lg text-yellow-200 text-xs font-medium shadow-lg shadow-yellow-900/30">
      ⚡ Mem Cache
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function LocalCacheNode() {
  return (
    <div className="px-3 py-2 bg-yellow-950 border-2 border-yellow-500 rounded-lg text-yellow-200 text-xs font-medium shadow-lg shadow-yellow-900/30">
      💾 Local Cache
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
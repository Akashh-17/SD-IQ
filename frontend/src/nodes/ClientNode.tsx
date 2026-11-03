import { Handle, Position } from "reactflow";

export function ClientNode() {
  return (
    <div className="px-3 py-2 bg-cyan-950 border-2 border-cyan-500 rounded-lg text-cyan-200 text-xs font-medium shadow-lg shadow-cyan-900/30">
      💻 Web Client
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function AppNode() {
  return (
    <div className="px-3 py-2 bg-cyan-950 border-2 border-cyan-500 rounded-lg text-cyan-200 text-xs font-medium shadow-lg shadow-cyan-900/30">
      📱 Mobile App
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function ThirdPartyNode() {
  return (
    <div className="px-3 py-2 bg-cyan-950 border-2 border-cyan-500 rounded-lg text-cyan-200 text-xs font-medium shadow-lg shadow-cyan-900/30">
      🔗 Third Party API
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
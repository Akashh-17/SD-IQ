import { Handle, Position } from "reactflow";

export function CDNNode() {
  return (
    <div className="px-3 py-2 bg-cyan-950 border-2 border-cyan-500 rounded-lg text-cyan-200 text-xs font-medium shadow-lg shadow-cyan-900/30">
      📦 CDN
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function ApiNode() {
  return (
    <div className="px-3 py-2 bg-indigo-950 border-2 border-indigo-500 rounded-lg text-indigo-200 text-xs font-medium shadow-lg shadow-indigo-900/30">
      🌐 API Gateway
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function LBNode() {
  return (
    <div className="px-3 py-2 bg-indigo-950 border-2 border-indigo-500 rounded-lg text-indigo-200 text-xs font-medium shadow-lg shadow-indigo-900/30">
      ⚖️ Load Balancer
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function ReverseProxyNode() {
  return (
    <div className="px-3 py-2 bg-indigo-950 border-2 border-indigo-500 rounded-lg text-indigo-200 text-xs font-medium shadow-lg shadow-indigo-900/30">
      🖥 ReverseProxy
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function FirewallNode() {
  return (
    <div className="px-3 py-2 bg-indigo-950 border-2 border-indigo-500 rounded-lg text-indigo-200 text-xs font-medium shadow-lg shadow-indigo-900/30">
      🛡️ Firewall
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function DNSNode() {
  return (
    <div className="px-3 py-2 bg-indigo-950 border-2 border-indigo-500 rounded-lg text-indigo-200 text-xs font-medium shadow-lg shadow-indigo-900/30">
      ᯤ DNS
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
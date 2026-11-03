import { Handle, Position } from "reactflow";

export function SqlDbNode({ data }: any) {
  return (
    <div className="px-3 py-2 bg-green-950 border-2 border-green-500 rounded-lg text-green-200 text-xs font-medium shadow-lg shadow-green-900/30">
      🗄️ SQL DB {data?.subtype ? `(${data.subtype})` : ""}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function NoSqlDbNode({ data }: any) {
  return (
    <div className="px-3 py-2 bg-green-950 border-2 border-green-500 rounded-lg text-green-200 text-xs font-medium shadow-lg shadow-green-900/30">
      🗃️ NoSQL DB {data?.subtype ? `(${data.subtype})` : ""}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function GraphDBNode({ data }: any) {
  return (
    <div className="px-3 py-2 bg-green-950 border-2 border-green-500 rounded-lg text-green-200 text-xs font-medium shadow-lg shadow-green-900/30">
      🖧 Graph DB {data?.subtype ? `(${data.subtype})` : ""}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function VectorDBNode({ data }: any) {
  return (
    <div className="px-3 py-2 bg-green-950 border-2 border-green-500 rounded-lg text-green-200 text-xs font-medium shadow-lg shadow-green-900/30">
      📑 Vector DB{data?.subtype ? `(${data.subtype})` : ""}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function TimeSeriesDBNode({ data }: any) {
  return (
    <div className="px-3 py-2 bg-green-950 border-2 border-green-500 rounded-lg text-green-200 text-xs font-medium shadow-lg shadow-green-900/30">
      📈 Time Series DB{data?.subtype ? `(${data.subtype})` : ""}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
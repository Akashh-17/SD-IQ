import { Handle, Position } from "reactflow";

export function QueueNode() {
  return (
    <div className="px-3 py-2 bg-pink-950 border-2 border-pink-500 rounded-lg text-pink-200 text-xs font-medium shadow-lg shadow-pink-900/30">
      📨 Message Queue
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function EventBusNode() {
  return (
    <div className="px-3 py-2 bg-pink-950 border-2 border-pink-500 rounded-lg text-pink-200 text-xs font-medium shadow-lg shadow-pink-900/30">
      ⛟ Event Bus
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function KafkaNode() {
  return (
    <div className="px-3 py-2 bg-pink-950 border-2 border-pink-500 rounded-lg text-pink-200 text-xs font-medium shadow-lg shadow-pink-900/30">
      📨 Kafka
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function PublisherNode() {
  return (
    <div className="px-3 py-2 bg-pink-950 border-2 border-pink-500 rounded-lg text-pink-200 text-xs font-medium shadow-lg shadow-pink-900/30">
      📢 Publisher
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

export function SubscriberNode() {
  return (
    <div className="px-3 py-2 bg-pink-950 border-2 border-pink-500 rounded-lg text-pink-200 text-xs font-medium shadow-lg shadow-pink-900/30">
      📩 Subscriber
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
// ─────────────────────────────────────────
// KEYWORD MAPS — what signals each topic
// ─────────────────────────────────────────

const TOPIC_KEYWORDS = {
  requirements: [
    "users", "scale", "dau", "mau", "qps", "rps", "requests per second",
    "latency", "sla", "assumption", "assume", "scope", "requirement",
    "how many", "traffic", "load", "peak", "throughput",
  ],
  components: [
    "service", "server", "client", "api", "gateway", "load balancer",
    "queue", "worker", "microservice", "component", "module", "layer",
  ],
  scaling: [
    "scale", "horizontal", "vertical", "sharding", "partition", "replica",
    "cache", "cdn", "bottleneck", "throughput", "distributed",
  ],
  db_schema: [
    "schema", "table", "column", "primary key", "foreign key", "index",
    "relation", "row", "field", "database design", "entity",
  ],
  tradeoffs: [
    "instead of", "because", "tradeoff", "trade-off", "vs", "versus",
    "chose", "over", "prefer", "reason", "why", "pros", "cons",
    "consistent", "available", "cap theorem",
  ],
  offline_handling: [
    "offline", "push notification", "apns", "fcm", "undelivered",
    "retry", "queue", "dead letter", "deduplication", "at least once",
  ],
  real_time: [
    "websocket", "sse", "server-sent", "polling", "long polling",
    "real-time", "realtime", "connection", "heartbeat", "pubsub", "pub/sub",
  ],
};

// ─────────────────────────────────────────
// Extract topics mentioned in text
// ─────────────────────────────────────────
export function extractTopicsFromText(text, problem) {
  if (!text) return [];

  const lower = text.toLowerCase();
  const detected = new Set();

  // Generic keyword detection
  for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        detected.add(topic);
        break;
      }
    }
  }

  // Problem-specific key_factors (existing logic preserved)
  if (problem?.topics) {
    for (const [key, topic] of Object.entries(problem.topics)) {
      for (const factor of topic.key_factors) {
        if (lower.includes(factor.toLowerCase())) {
          detected.add(key);
          break;
        }
      }
    }
  }

  return [...detected];
}

// ─────────────────────────────────────────
// Extract topics implied by graph nodes
// ─────────────────────────────────────────
export function extractTopicsFromGraph(graph, problem) {
  if (!graph?.nodes) return [];

  const topics = new Set();

  // Problem-specific node mapping (existing logic preserved)
  if (problem?.node_to_topic) {
    for (const node of graph.nodes) {
      const topic = problem.node_to_topic[node.type];
      if (topic) topics.add(topic);
    }
  }

  // Generic node type → topic inference
  for (const node of graph.nodes) {
    const t = node.type?.toLowerCase() || "";
    if (t.includes("cache") || t.includes("cdn")) topics.add("scaling");
    if (t.includes("queue") || t.includes("notification")) topics.add("offline_handling");
    if (t.includes("websocket") || t.includes("socket")) topics.add("real_time");
    if (t.includes("db") || t.includes("database")) topics.add("db_schema");
    if (t.includes("lb") || t.includes("load")) topics.add("scaling");
    if (t.includes("api") || t.includes("service")) topics.add("components");
  }

  return [...topics];
}

// ─────────────────────────────────────────
// Silently update what topics candidate has covered
// Called after every user turn — result stored in state but never shown
// ─────────────────────────────────────────
export function updateTopicsCovered(existing, text, graph, problem) {
  const base = existing || {
    requirements: false,
    components: false,
    scaling: false,
    db_schema: false,
    tradeoffs: false,
    offline_handling: false,
    real_time: false,
  };

  const fromText = extractTopicsFromText(text, problem);
  const fromGraph = extractTopicsFromGraph(graph, problem);
  const allDetected = new Set([...fromText, ...fromGraph]);

  const updated = { ...base };
  for (const topic of allDetected) {
    if (topic in updated) {
      updated[topic] = true;
    }
  }

  return updated;
}
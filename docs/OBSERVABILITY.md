# Debugging in production

SystemIQ writes Pino JSON logs to stdout in production (`NODE_ENV=production`).
Development uses `pino-pretty`; set `LOG_FORMAT=json` for machine-readable local
logs. `LOG_LEVEL` defaults to `info`; use `debug` when needed. The old
`sample.txt` logger has been removed. `LOG_TO_FILE` no longer controls logging.
Mock mode still writes operational logs; it never logs fixture answers.

## Follow one request

Every HTTP response, including validation failures, preflight and unauthorized
metrics requests, includes `X-Request-Id`. An incoming ID is accepted when it is
1–128 characters of letters, digits, `_`, `.`, `:`, or `-`; unsafe or
credential-like values are replaced with a UUID. The header is exposed to
browser clients. Supply an ID for a reproducible investigation:

```sh
curl -i -H 'X-Request-Id: debug-health-1' http://localhost:5000/health
```

Search your log collector by `requestId`, or filter JSON logs locally:

```sh
jq 'select(.requestId == "debug-health-1")' application.log
```

AsyncLocalStorage carries that ID through awaited services, LangGraph nodes and
LLM calls. Startup and work outside an HTTP request use `requestId=background`.
`http.request` events contain method, route template, status and `durationMs`.
Disconnected responses are recorded once with status 499. Streaming HTTP timing
includes the full stream; its separate `Interview turn timing` event includes
`timeToFirstTokenMs`, `totalMs`, transport and outcome. An SSE application error
can occur after HTTP 200 headers were sent: inspect its outcome and node logs.

## Diagnose an interview

Each execution of every LangGraph node emits one `graph.node` summary with
`node`, `durationMs`, `interviewId`, `outcome` (`success` or `failure`) and the
request ID. The wrapper preserves the original config, writer, signal, return
value and thrown error. Initialization has greeting/interviewer nodes; a normal
answer also has graphAnalyzer, intent, orchestrator, evaluator and
conversationManager nodes. Questions and wrap-up skip the evaluator.

Start with the HTTP request ID, then find the slowest node. A slow graphAnalyzer
suggests diagram analysis; slow intent/evaluator/conversationManager/interviewer
nodes suggest model/provider latency. `systemiq_llm_errors_total` and `llm.error`
logs identify failing model interfaces. A node that handles a provider error
internally can complete successfully while the LLM error counter increases.
Errors are rethrown unchanged to the application; only their safe types, never
messages, stacks, prompts or provider responses, are logged.

For an offline demonstration:

```sh
# Run in backend; Windows PowerShell: $env:LOG_FORMAT="json"; npm run dev:mock
LOG_FORMAT=json npm run dev:mock
```

Start an interview from the frontend mock demo and send a design answer. Expect
one JSON timing summary per executed node, with one shared request ID. Mock mode
uses the same telemetry interfaces as real providers.

## Prometheus metrics

`GET /metrics` returns Prometheus text format from a dedicated prom-client
registry. When `METRICS_TOKEN` is nonempty, send
`Authorization: Bearer <METRICS_TOKEN>`. Missing or incorrect tokens return 401.
Keep metrics behind a private network or configure this token before deployment.
Tokens are never included in logs or metric labels.

| Metric | Labels / meaning |
| --- | --- |
| `systemiq_http_request_duration_seconds` | method, route template, status; includes full streaming duration |
| `systemiq_langgraph_node_duration_seconds` | node, outcome |
| `systemiq_llm_calls_total` | model (`main`/`fast`), operation (`invoke`/`structured`/`stream`) |
| `systemiq_llm_errors_total` | same labels; failed and cancelled logical LLM calls |
| `systemiq_active_interviews` | live Redis interview metadata keys at scrape time |

LLM counters measure logical calls, not tokens or underlying provider retry
attempts. Nested invokes inside a structured or streaming call are counted once.
Instrumentation is installed before graph node modules create structured-output
runnables. No model service implementation is changed. Voice transcription is
not part of these LLM counters.

The active-interview gauge scans Redis with SCAN, ignores transcript/graph keys,
and deduplicates scan results. Mock Redis uses its in-memory keys with the same
expiry check. This is a shared-datastore view: multiple API replicas report the
same total, so use `max`, not `sum`, across replicas. Redis changes during a scan
can affect a scrape's point-in-time count. Failed collection omits the gauge sample and writes a
safe metrics error log rather than reporting a misleading zero. For very large session
counts, replace scrape-time scanning with a dedicated expiring session index.

Request IDs, interview IDs, URLs, candidate text and authorization values are
never metric labels. Unmatched URLs share the `unmatched` label. HTTP metrics
for the metrics request itself appear on the following scrape.

Example queries:

```promql
histogram_quantile(0.95, sum by (le, route) (rate(systemiq_http_request_duration_seconds_bucket[5m])))
sum by (node) (rate(systemiq_langgraph_node_duration_seconds_sum[5m]))
sum(rate(systemiq_llm_errors_total[5m])) / clamp_min(sum(rate(systemiq_llm_calls_total[5m])), 0.001)
max(systemiq_active_interviews)
```

## Privacy boundaries

The existing `log(section, data)` API remains available. Its data is filtered to
an allowlist of operational numbers, enum values and validated identifiers.
Candidate messages, transcripts, graph labels, summaries, report feedback and
arbitrary nested payloads are omitted even at debug level. Authorization headers,
cookies and credential fields are redacted. All legacy console calls in backend
source now use the safe logger helpers. Framework errors use the same boundary.
Never add a raw request, state, Error stack or provider payload to a log line.

## Validation

`npm test` in backend includes request-ID concurrency, malformed input, redaction,
metrics authorization and shape, HTTP route cardinality, active-session expiry,
node success/failure, nested LLM call counting, streaming errors, and a mock
interview asserting one correlated timing record per executed node. Run the
frontend verification suite as described by AGENTS.md after integration changes.

# SystemIQ interview knowledge

The catalog contains eight synthetic interview exercises. IDs are stable:

| ID | Problem | Difficulty |
| --- | --- | --- |
| `url_shortener` | Design TinyURL | Easy |
| `chat_app` | Design WhatsApp | Medium |
| `google_drive` | Design Google Drive | Medium |
| `instagram` | Design Instagram | Medium |
| `uber` | Design Uber | Hard |
| `rate_limiter` | Distributed rate limiter | Medium |
| `notification_system` | Multi-channel notifications | Medium |
| `news_feed` | High-degree-aware home feed | Hard |

Named products describe familiar problem categories. Traffic numbers are explicit
exercise assumptions, not claims about those companies' actual production systems.

## Shared stage contract

Every problem uses exactly these names, in this order:

1. **Requirements**: scope, measurable quality targets and workload arithmetic.
2. **High Level Design**: logical responsibilities and critical request/data paths.
3. **Core Flow**: the problem-specific mechanism, including concurrent or retried work.
4. **Data Model**: keys, indexes, lifecycle records and access boundaries.
5. **Reliability**: failure recovery, retries, consistency and privacy/correctness.
6. **Scaling**: partitioning, hotspots, amplification and capacity budgets.
7. **Tradeoffs**: justify the selected design and its limits against alternatives.

Core Flow retains each domain's depth: short-code allocation, chat delivery and
ordering, resumable file publication/sync, media/feed publication, exclusive ride
assignment, atomic rate-limit budgets, provider delivery attempts, or hybrid feed
assembly. Domain-specific questions and criteria remain different despite the
shared stage bar. All exercises estimate 45 minutes, matching the current app timer.
The supported difficulty levels are SDE1, SDE2 and Senior, matching API validation.

## Files and actual consumers

Each problem folder contains exactly the five files read by `loadKnowledge()`:

| File | Authored shape and use |
| --- | --- |
| `problem.json` | Stable folder-matching ID, title, difficulty, description, requirements, constraints, exclusions and synthetic scale. `contextBuilder` passes it to evaluator/interviewer prompts. |
| `interview.json` | Duration, supported levels and ordered stages. Every stage has `name`, `entryQuestion`, `objective` and `completionCriteria[{name, required, concepts, guidance}]`. The greeting and session manager copy these into the active objective; the decision engine gates progress on required criterion names. |
| `evaluation.json` | One rubric topic per shared stage, concepts with importance/probe guidance, and score anchors. Passed to the evaluator. Topic weights and minimumCoverage are advisory metadata; they are not programmatic gates or the report's score formula. |
| `architecture.json` | Reference component purposes, tradeoff alternatives, example entities/keys and request flows. Passed as architecture knowledge to the evaluator; it is one coherent reference design, not the only valid design. |
| `graph.json` | Component aliases, recommended/optional nodes, connections and graph checks. Loaded as reference material. The current graph analyzer separately reads the candidate's actual whiteboard; this file does not enforce a golden diagram or replace spoken reasoning. |

`schema.js` is the shared Zod authoring contract. Root-level files are not problem
folders and are ignored by the problem listing and validator. No application
loader, prompts, controllers or scoring code is changed by this content task.

## Fair evaluation

- Required criteria describe outcomes and invariants, not a demand to name every
  example technology. Concepts can contain alternatives; explain one correct
  approach and its limits rather than implementing all of them.
- Optional features are marked `required: false` and optional in the rubric.
  A chronological feed, no deduplication, or a justified database/broker choice
  can earn full credit for the appropriate baseline.
- Evaluate only the latest answer against the current question and objective.
  Missing future-stage details must not reduce the current answer's score.
- Compare capacity calculations with the declared assumptions. Accept sensible
  rounding and an explicitly justified alternative workload.
- Score anchors describe integer reference bands from 0 to 10; intermediate
  scores remain allowed by the evaluator schema. Actual report stage averages
  and the overall score are computed by `computeStageScores`/reportGenerator,
  independently of the advisory topic weights.
- Diagram boxes and service deployment boundaries are illustrative. Equivalent
  logical roles may be colocated. Never penalize a candidate solely for not
  drawing a reference component or for choosing a different valid vendor.

## Capacity conventions

Rates use 86400 seconds/day. `averagePerSecond` and `peakPerSecond` are rounded
to two decimals; peaks are calculated from the unrounded average. Byte totals
are exact integers. `storageEstimates` multiply records/day by bytes/record and
`days` (a stated retention or cohort sizing window); `stateEstimates` multiply
concurrent entities by logical bytes/entity. Both show an explicit replication
factor. Decimal GB/TB and binary MiB/GiB are identified in the text. Indexes,
allocator overhead, retries, old live cohorts and derivatives are excluded only
where the problem explicitly calls that out and asks for a separate budget.

Useful anchors include 1 million links/day versus 100 million redirects/day,
400 million sent chat messages/day versus 800 million recipient deliveries/day,
10 MiB mean file uploads, and 100000 location updates/s at the stated driver
concurrency. Notifications separate intents from channel attempts; feeds separate
posts, fanout reference writes, page reads and post hydration. The rate-limiter
example refills at 100/60 tokens/s with capacity 20, rather than confusing refill
rate with burst capacity.

## Validation and tests

From backend, run:

```sh
npm run validate:knowledge
npm test
```

The validator reads paths from `config/paths.js` and works regardless of the
launch directory. It reports missing/invalid files with folder and field paths,
and exits nonzero on failure. Besides shapes, it checks stable folder IDs, common
stage order, rubric alignment, required-criterion coverage, unique names,
reference graph component/edge integrity, advisory weights, score-anchor coverage,
and average/peak/storage arithmetic. It does not verify real-company facts or
prove that a proposed architecture meets an SLO.

The test suite includes malformed and cross-file-invalid fixtures, CLI success
and failure, the actual catalog, and complete mock-mode interviews on all three
new problems through the real routes and LangGraph stage transitions.

## Audit changes to the original five exercises

- Removed unsupported real-company DAU claims and unqualified enormous loads;
  replaced them with internally consistent synthetic baselines and derived rates.
- Unified mismatched stage names such as Database/Database Design and
  Media Storage/Media Pipeline; aligned every rubric topic to its actual stage.
- Removed the unavailable Junior level and inconsistent duration estimates.
- Made vendor and algorithm alternatives optional examples, rather than separate
  critical requirements that would unfairly demand mutually exclusive designs.
- URL shortener: atomic alias uniqueness, collision retries, expiry-aligned cache
  TTL and 301/302 deletion tradeoffs; analytics drains to its own service.
- Chat: durable replay, stable client IDs, per-conversation order and membership
  checks; transient Pub/Sub is not a durable offline backlog.
- Drive: resumability is required, binary conflicts cannot silently overwrite,
  deduplication is optional and tenant-scoped, and revoked grants bound URL access.
- Instagram: added the missing durable metadata store, made advanced ranking
  optional, and fixed media delivery to a client-to-CDN/object path.
- Uber: corrected the CDN-to-notification alias, added declared Trip Service and
  database roles, separated GPS traffic from trip traffic, and required fenced
  assignment and idempotent payments rather than a list of geospatial products.

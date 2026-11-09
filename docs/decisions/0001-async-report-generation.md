# 0001: Background report generation with Redis status

- Status: Accepted
- Date: 2026-11-08

## Context

A report needs a slow model call plus several persistence operations. Holding
`POST /api/interview/end` open makes the interview appear stuck and invites
repeated End clicks. ReportService already provides a Redis SET NX EX report
lock, reusable generated output, retry-safe persistence, and a report row written
last as the durable completion marker.

## Decision

End checks ownership and checkpoint availability, admits at most one background
job using `lock:report-job:<id>`, stores `report:<id>:status`, and returns 202
`{"status":"generating"}` without awaiting model generation. A saved report
returns 200 `{"status":"ready"}`. The job starts on the next event-loop turn
and calls the existing locked ReportService.generate path; the report lock and
persistence ordering are unchanged. Agent-triggered generation uses that same
path and records status too.

The authenticated, ownership-protected status route checks the durable report
first. Otherwise it returns generating while a job/report lock is live, or a safe
failed state. Status records expire after 24 hours. The admission lock expires
after 150 seconds; the original generation lock remains 120 seconds. If the
process dies, polling detects interruption once those locks expire. Retrying End
admits a new job and reuses a generated report already cached in the session.

The frontend navigates after the fast acceptance response, polls without overlap
starting every 2 seconds, and backs off to a 15-second ceiling. Network failures
also back off. Waiting steps are illustrative, not fabricated backend percentages;
reduced-motion preferences are respected. Failure offers an explicit retry.

## Why no job queue yet

An in-process background job is a small change that fits the current application
and demo workload. Redis coordinates replicas, and the existing report lock is
still the authority for preventing duplicate generation. This avoids deploying a
worker and changing Redis infrastructure before there is a demonstrated need.

This is not a durable queue: jobs do not survive process termination, retry is
user-driven, and the API process must stay alive after sending 202. A long job
can outlive an expiring lock, as in the existing generation design. Deploy this
on a long-lived server, not a request-scoped serverless runtime. A crash or partial
persistence failure may delay recovery until locks expire; session expiry bounds
how long an unfinished interview can be retried.

## When to use BullMQ

Switch when reports need guaranteed delivery, automatic bounded retries, worker
isolation, scheduling/concurrency limits, or reliable draining during deployments.
Use durable job IDs derived from interview IDs, retain the final report existence
check and idempotent writes, and use renewable worker-owned leases. Verify the
chosen Redis service supports BullMQ's required Redis protocol and Lua commands;
the application's current Upstash REST interface is not a BullMQ connection.

## Verification

Deferred-LLM tests prove 202 arrives before generation finishes; duplicate End
calls generate one report; failure transitions to failed then retry to ready;
status ownership returns 404 for another user. Frontend tests cover polling,
backoff, cancellation, retry, and navigation on acceptance. Existing chat and SSE
wrap-up regression tests remain in the suite.

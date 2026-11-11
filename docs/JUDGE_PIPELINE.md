# Judge Pipeline Notes

## Current implementation

- Monaco runs in the browser for C++17, C++20, Python 3, and Java, with per-user/per-problem/per-language drafts in local storage.
- `/api/judge/run` requires an authenticated session and a reachable `JUDGE0_API_URL`. It returns HTTP 503 when Judge0 is not configured and never pretends a mock result is execution.
- `/api/submissions` validates the request, accepts only public, non-deleted problems, and judges only hidden tests. Public/sample test data is not returned in submission responses.
- Judge0 status IDs are mapped server-side. Output comparison normalizes CRLF and trailing whitespace only.
- EXP is awarded only for the first accepted solve of a problem, inside a database transaction. The unique `(userId, source, referenceId)` ledger constraint is intended to make this idempotent under concurrency.

## Known limits

The route waits synchronously for Judge0 and iterates over test cases serially. A timeout or infrastructure error after a submission row is created can leave it in `JUDGING`; a durable queue/worker and reconciliation job are still required. The app-side API is not itself a sandbox. Judge0 must be privately networked and configured with appropriate isolation and resource limits. Contest/exam access control and authorization for private problem assignments are not implemented in this submission route yet; for now only public problems can be submitted.

The EXP schema change requires a database migration/push before deploying this code. Check existing duplicates in `(userId, source, referenceId)` before applying the unique index to a populated database.

## Tests

`pnpm test` runs unit tests for output normalization, Judge0 verdict mapping, and difficulty rewards. Integration tests require a test database and a Judge0 test service; neither is implied by the unit test pass.

# Assessment attempt lifecycle

Applies to high-stakes tests (internal flow value `legacy`) and learning batch assessments.

- Start creates a new attempt with a new beginKey and session. Retrying the same request in the same live session is idempotent.
- End test sends the existing assessment update API with `action: "end"`. Keep going dismisses the dialog.
- Navigation and page unload send a keepalive end request. The next visit never offers resume and creates a fresh question pool at position zero on Start.
- Abandoned attempts retain their questions, submitted responses, timings and timestamps. They are not marked completed or passed/failed.
- Unfinished learning assessments do not advance or fail the batch. The student remains eligible to start that batch assessment again.
- Completed tests retain existing pass/fail and progression behavior.

## Abrupt disconnections
Unload delivery is best effort. The backend rejects updates after the existing 15-second heartbeat lease expires; reports/export mark stale attempts ended. Starting a new attempt also ends the previous unfinished attempt in that test namespace. Crash end timestamps indicate when the server detected closure, not an exact browser-close timestamp. A prolonged hidden-tab/network interruption can expire the lease.

## Admin reports and export
All attempts are included, with Completed / Ended unfinished / In progress status, answered count, start and end dates, and every question. Unanswered questions have blank response/timing fields. Average response time uses answered items; accuracy and correct-under-time percentages use the full question count. CSV dates remain America/Los_Angeles; UI dates remain device-local. Date filters now apply to attempt start dates so unfinished attempts can be found.

Standalone tests display HIGH STAKES TEST. Internal routes and stored flow values remain unchanged for compatibility.

## Backend rollout
Deploy backend and frontend together. Startup replaces old active/batch uniqueness indexes with one active session per test namespace and one completed learning assessment per batch. Historical attempts are retained. No production deployment or migration was executed during development.

## Verification
Backend Gradle tests; frontend Vite build; `END_TEST_ONLY=1 node scripts/test-assessment-browser.mjs` for mocked-browser quit, refresh, fresh start, completion and report controls.

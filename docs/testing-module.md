# Testing Module — Test A

## Student flow

Login → existing identity confirmation and streak → LEARN / TAKE A TEST.
LEARN retains the existing theme/operation flow. Test A has an instructions screen;
only Begin creates/starts an attempt. Test B is visibly unavailable for now.

Test A snapshots the backend addition catalogs, deduplicates ordered pairs, includes
both orientations of non-identical pairs, and shuffles the resulting pool. The
current 19-level curriculum gives **213 questions**. New catalog facts are picked
up by new attempts; an existing attempt keeps its original content/order.

Students enter numeric answers without choices, hints, or correctness feedback.
The next question's text is prefetched without answers or hints and displayed
immediately on Submit while the answer saves. Students can type the next answer,
but cannot submit it until the previous save is confirmed. Failed saves restore
the submitted question/input for an idempotent retry; completion waits for the
final save. Quit returns to mode choice
and preserves the attempt. Refresh requires the normal login flow again; choosing
Test A resumes the next unanswered item. The current input draft survives refresh
in the same tab. Completed attempts show only “Test complete” and return to mode
choice after five seconds. A new attempt can then be started.

## Timing and durability

- Assessment timing is server-based and independent of application usage and all
  existing quiz/game timing. It has no additional countdown or deadline.
- Visible test time is checkpointed every five seconds. Explicit quit, hiding the
  tab, navigation, and pagehide request a pause; returning resumes the same item.
- If the browser crashes or cannot deliver its final checkpoint, the last saved
  checkpoint is retained. Unconfirmed gaps longer than a 15-second lease are not
  added on reconnect. Exact unsent milliseconds cannot be recovered after a crash.
- An attempt has one owning browser session at a time. Explicitly resuming in a
  different tab takes ownership; the former tab must resume before submitting.
- MongoDB optimistic versioning, the current question index, and unique indexes
  protect against concurrent answers, retries, and duplicate active attempts.
- Begin uses an idempotency key, including retries whose response was lost.
- No test answer/result changes learning scores, belts, or curriculum progression.
  Global application usage and the existing inactivity logout continue unchanged.

## Backend

New collection: `assessmentAttempts`. Stores the user, test type, curriculum
snapshot/order, submitted answers, per-item times, totals, start/completion dates,
current position, timing checkpoint, session owner, and optimistic version.
Completed attempts are retained. New indexes are created at backend startup;
existing user, quiz, and usage collections do not require migration.

All endpoints use the existing `x-pin` mechanism, with explicit user/owner or
admin validation. Student responses contain only ID, type, completion status,
position, count, the current problem, and one next-problem preview—never answer keys or correctness.

| Endpoint | Purpose |
| --- | --- |
| `GET /api/assessments/current` | Find an unfinished Test A without starting it |
| `POST /api/assessments/start` | Begin/resume; body: `beginKey`, `session` |
| `POST /api/assessments/{id}` | Body: `session`, `position`, `action` (`answer`, `heartbeat`, `pause`), optional numeric-string `answer` |
| `GET /api/admin/assessments` | Completed history, 25 attempts/page |
| `GET /api/admin/assessments/export` | CSV of all matching attempts/items, not just the displayed page |

Admin filters: `student` (PIN), `type`, `from` (inclusive ISO timestamp), `to`
(exclusive ISO timestamp); report pagination uses zero-based `page`.
The UI converts the administrator's local calendar-day range to those timestamps.

## Verification

Instant advancement requires the updated backend's `nextProblem` response field.
Restart/redeploy the backend as well as the frontend; an older running backend
cannot supply the preview, so the compatible fallback waits for the save response.

- Backend: `JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home ./gradlew test bootJar`.
- Frontend: `npm run build`.
- Browser smoke test: `node scripts/test-assessment-browser.mjs` (Chrome; optional
  `CHROME_BIN`). It starts an isolated Vite instance on port 59991 and intercepts
  the mock API origin. It does not call a live backend or change student data.
- Backend unit tests cover curriculum completeness, deduplication, retry handling,
  timing, completion, tab ownership, student-response redaction, and CSV escaping.

Before deployment, also run a staging MongoDB end-to-end check of concurrent Begin
requests, reconnects, and saved results/export. Mocked browser/unit tests do not
replace verification against the deployed database and network.

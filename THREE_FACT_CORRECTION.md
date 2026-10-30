# Three-fact correction loop

## Student flow

A wrong answer or the existing inactivity/slow-answer trigger in a learning quiz opens the correct-answer screen. **Next** starts a randomized round of three facts. All three must be answered correctly without help within the configured **total** active response time (default 6 seconds, inclusive).

An incorrect answer or expired round shows the correct answer for that item. **Next** reshuffles the same three facts and restarts the entire round. Successful practice returns to the existing quiz/game continuation, or its existing result screen when the missed item was last. Correction answers do not add score.

Applies to pretests, colored belts, black belt degrees, Lightning, Surf, Rocket, Bonus and the existing Fractions learning quizzes. Initial pre-quiz teaching and independent/batch assessments are unchanged.

## Fact selection

- Start with the current missed fact.
- Rank the student's recorded wrong/inactivity learning attempts in the same operation by frequency. Exclude practice attempts; select up to two distinct additional facts.
- Fill missing slots with **1 + 1**, then **2 + 2**, including in other subjects.
- If a fallback duplicates a selected fact, continue to the next distinct addition double (for example 3 + 3). Distinctness uses operation and ordered operands.
- Rocket corrections retain reverse arithmetic: show the result, then choose the matching expression from four choices. Other modes use the numeric keypad. The original question is retained for the existing continuation handler. Fraction answer scaling/labels are preserved. Saved forward Rocket loops are upgraded without resetting their pool, round position or elapsed time.

## Persistence and timing

`quiz_runs.correctionLoop` stores the pool, shuffled order, phase, position, elapsed active milliseconds, configured limit, revision, original practice question and final continuation receipt. No existing records are reset.

The timer measures active browser response time, excluding answer displays, network-save waits, paused/hidden pages and time away. A pause action checkpoints elapsed time. Page-hide requests use keepalive; an abrupt device/network loss can only restore the last successfully saved checkpoint. Operations remains a navigation screen. A saved correction resumes only when selecting its matching subject/level and belt or degree; pretest corrections resume on selecting the relevant level. Quiz preparation/start/answer/completion enforce the pending correction on the backend.

Actions carry the correction ID and expected revision. Repeated acknowledged revisions return saved state without consuming another answer or time. The final handoff stores its receipt and an advance checkpoint so retries do not advance the original run twice. This follows the application's existing cached-run infrastructure.

## API

All routes use the existing `x-pin` authentication. Run-specific routes enforce ownership and learning access.

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/quiz/pending-correction` | `{ "quizRunId": "..." }`, or null when none is pending |
| GET | `/api/quiz/{runId}/correction` | Read saved correction state |
| POST | `/api/quiz/{runId}/correction` | Apply `next`, `answer`, `timeout` or `pause` |
| POST | `/api/quiz/practice/answer` | Existing continuation endpoint; requires a passed loop when one is pending |

Correction request:

```json
{"id":"correction-uuid","revision":1,"action":"answer","answer":2,"responseMs":1200}
```

State includes `id`, `revision`, `phase` (`answer`, `practice`, `passed`, `finished`), `question`, `position`, `elapsedMs`, and `limitMs`. Invalid state transitions, IDs, future revisions or negative response times are rejected.

Existing `/quiz/prepare` returns `correctionPending: true` and the saved run ID when correction must resume. `/quiz/start` includes the original `practice` question, operation, level, belt, counters and normal mode metadata for pending corrections.

## Admin setting

Admin Settings → Global: **Correction loop: total time for 3 facts (sec)**.

The existing configuration endpoint accepts `correctionRoundLimitMs` (1,000–300,000 milliseconds); configuration reads expose `general.correctionRoundLimitMs`. Older configs default to 6,000 milliseconds. An active correction retains its captured limit; new loops use updated settings.

## Validation

- Backend Gradle tests include timing boundaries, fallback selection across subjects, duplicate requests, wrong/inactivity resets, pauses, Mongo serialization, config changes, all mode continuation paths and final-item completion.
- Frontend production build.
- Isolated Chrome smoke tests with mocked APIs: correction UI on phone width, wrong reset, saved resume and continuation for normal/pretest/Lightning/Surf/Rocket/Bonus, plus normal/pretest last-item results.
- Existing assessment, navigation and admin report/filter/export browser regressions.

Run browser correction checks with `CORRECTION_ONLY=1 node scripts/test-assessment-browser.mjs`; optional `CORRECTION_MODE` values: `pretest`, `lightning`, `surf`, `rocket`, `bonus`, `last`, `pretest-last`.

No production migration or deployment is performed by this implementation.

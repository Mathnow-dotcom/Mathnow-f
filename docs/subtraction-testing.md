# Subtraction testing (Test B)

Test B is subtraction only, not a combined Addition/Subtraction test.

- `/test-selection` offers Addition and Subtraction; `/test-b` uses the existing assessment screen.
- The backend builds the pool from all `sub` catalog facts. Each distinct ordered pair occurs once. Operands are not reversed. The current 11-level curriculum contains 66 unique questions, including the corrected Level 3 White Belt fact `3 - 2`.
- Each new attempt shuffles and snapshots its pool. Curriculum additions enter future attempts; existing attempts retain their saved pool and order.
- `GET /api/assessments/current?type=B` loads the unfinished subtraction attempt.
- `POST /api/assessments/start` accepts `type: "B"` alongside the existing `beginKey` and `session`. Omitting type retains Addition behavior. Only A/B are accepted.
- Answer, heartbeat and pause APIs are unchanged; the persisted attempt type determines display and scoring.
- Addition and Subtraction have independent unfinished attempts and Begin keys. Existing Addition records require no migration.
- Timing, optimistic next-question display, save acknowledgement lock, drafts, quit/resume and completion use the same implementation as Addition. Global usage tracking remains unchanged.
- Admin filtering includes Test B. Existing accuracy, average time, correct-under-two-seconds, per-item details and CSV export apply to both tests. CSV identifies Subtraction by type B.

Deploy the backend before the frontend so the new type is supported before students can select it.

After deploying/restarting the corrected backend, its existing curriculum reconciliation updates Level 3 White Belt in the database. Newly created subtraction attempts then contain 66 questions. Earlier unfinished attempts retain their original 65-question snapshot when resumed; finishing one and starting a new attempt uses the updated pool. Completed reports retain their original question counts.

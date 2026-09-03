# Panorama, Integridad y Piloto TutorPAES Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the existing TutorPAES codebase into an evidence-based, understandable base for a controlled pilot without confusing implemented code with validated educational value.

**Architecture:** Preserve the current Next.js BFF, FastAPI, SQLAlchemy, PostgreSQL and Alembic architecture. Work is organized by user-visible capability and data flow, while Codebase Memory is used to find entry points and dependencies. No production code changes are allowed unless a blocking finding has a focused regression test and an explicit approval.

**Tech Stack:** Next.js App Router, React, TypeScript, FastAPI, SQLAlchemy, PostgreSQL, Alembic, pytest, Jest, Playwright and Codebase Memory MCP.

---

## Working Rules

- Canonical repository: `/home/gabriel/Escritorio/Proyectos2026/Tutor-PaesV3`.
- Investigation notes: `/home/gabriel/Memoria semantica/TutorPAES/Investigacion-Cierre-Operativo/`.
- Every claim is tagged as `SOURCE`, `AUTOMATED_TEST`, `REAL_OPERATION`, `HUMAN_REVIEW` or `NOT_VERIFIED`.
- Every block ends with a test gate before the next block starts.
- Tests with mocks prove contracts or local behavior; they do not prove provider connectivity, production data quality or educational effectiveness.
- The real-interaction space must use isolated demo data, never real student data or real payment credentials.
- Agy/Antigravity audits the result of each block; Gabriel approves scope; OpenCode executes only the approved technical unit.

## Standard Block Gate

Each block must produce the following before it is closed:

1. **Analysis:** files, graph paths, assumptions and expected behavior.
2. **Small change or decision:** one bounded correction, or an explicit decision to preserve/postpone/migrate.
3. **Automated verification:** focused test first, then the directly affected suite.
4. **Real interaction:** a human follows the user or operator flow with expected/actual/evidence/verdict.
5. **Handoff:** risks, remaining `NOT_VERIFIED` items, Agy review request and one next action.
6. **Commit:** only after review, and one intention per commit.

Use these verdicts:

- `PASS`: verified without material limitation.
- `PASS_WITH_LIMITATION`: works, but a documented boundary remains.
- `FAIL_BLOCKING`: prevents the target flow or makes the result unsafe.
- `NOT_VERIFIED`: evidence is missing; do not infer success.

---

## Block 0: Baseline and Graph Hygiene

**Purpose:** Establish the exact repository, commit, environment and useful portion of the graph before trusting old status claims.

**Files and evidence:**

- Read: `README.md`, `docs/status/`, `docs/superpowers/specs/`, `docs/superpowers/plans/`.
- Record: `Investigacion-Cierre-Operativo/01-ESTADO-INICIAL.md`.
- MCP project: `home-gabriel-Escritorio-Proyectos2026-Tutor-PaesV3`.

- [ ] Record `git status --short --branch`, `git log -10 --oneline`, `git diff --check` and the exact commit used.
- [ ] Confirm Codebase Memory status is `ready` for the canonical path.
- [ ] Separate product nodes under `tutorpaes/backend/app` and `tutorpaes/frontend/app|src` from tests, scripts, `.agents` and archived documentation.
- [ ] Use `search_graph` for routes and exact qualified names; use `trace_path` only after resolving the exact symbol.
- [ ] Mark old node counts, old percentages and old “ready” statements as historical when they do not match the current commit.

**Test gate:** No code change. Run the documented backend, frontend and typecheck commands only if dependencies are available; record failures as evidence.

**Real-interaction space:** Open the project from the canonical path, start the documented stack if possible, and record whether the operator can reproduce the startup without hidden context.

**Exit:** A current baseline note exists and the graph is treated as a navigation aid, not as proof of behavior.

## Block 1: Database Integrity and Reproducible Data

**Purpose:** Determine whether the database supports trustworthy student behavior, not merely whether the API returns HTTP 200.

**Files and evidence:**

- Read: `tutorpaes/backend/app/db/models.py`, `tutorpaes/backend/app/db/session.py`, `tutorpaes/backend/migrations/versions/`.
- Read: `tutorpaes/backend/scripts/seed_paes.py`, `seed_paes_data.py`, `seed_questions.py`, `seed_user.py`.
- Create: `Investigacion-Cierre-Operativo/05-INTEGRIDAD-BASE-DATOS.md`.

- [ ] Record PostgreSQL version, database URL shape without credentials, Alembic `current`, `heads` and migration history.
- [ ] Compare SQLAlchemy models, Alembic migrations and the schema actually created by `dev-up.sh`.
- [ ] Verify primary keys, foreign keys, unique constraints, required fields and indexes for users, exams, subjects, topics, questions, attempts, answers, feedback, progress, courses, payments, invoices and chat.
- [ ] Check orphan rows with read-only queries for every foreign key relationship.
- [ ] Check domain invariants: every question has one valid topic and answer set; every answer belongs to an attempt and question; every attempt belongs to one user; progress references existing users/topics; authorized payments map to invoices when required.
- [ ] Check uniqueness and idempotency of seeds by running the seed procedure twice in an isolated database and comparing counts and keys.
- [ ] Run a backup and restore rehearsal using `scripts/db-backup.sh`, `scripts/db-restore.sh` or the actual documented equivalents, without touching a user database.
- [ ] Classify each finding as `PASS`, `PASS_WITH_LIMITATION`, `FAIL_BLOCKING` or `NOT_VERIFIED`.

**Minimum read-only SQL checks:**

```sql
SELECT conrelid::regclass AS table_name,
       conname,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype IN ('p', 'f', 'u', 'c')
ORDER BY conrelid::regclass::text, conname;

SELECT q.id
FROM questions q
LEFT JOIN topics t ON t.id = q.topic_id
WHERE t.id IS NULL;

SELECT a.id
FROM answers a
LEFT JOIN exam_attempts ea ON ea.id = a.attempt_id
LEFT JOIN questions q ON q.id = a.question_id
WHERE ea.id IS NULL OR q.id IS NULL;
```

Adapt column names only after verifying the real schema. Do not run destructive cleanup as part of this block.

**Test gate:** Focused model/migration/seed tests, then the backend suite. A green suite does not close the block if orphan or seed-idempotency checks fail.

**Real-interaction space:** Create one isolated student attempt, answer one question, inspect the persisted rows, reload progress/results, then remove the isolated database or container. Record before/after state and rollback result.

**Exit:** Database integrity is either demonstrated for the pilot dataset or has named blockers and owners.

## Block 2: Authentication, Roles and Session Boundaries

**Purpose:** Prove that student, teacher and admin identities cannot cross their boundaries.

**Graph targets:** `login`, `get_current_user`, `require_admin_user`, `require_teacher_user`, `me`, `relayAuthResponse`, `ProtectedView`.

- [ ] Map login, refresh, logout, protected route and role propagation from frontend to backend.
- [ ] Verify password policy, token expiry/revocation and error responses.
- [ ] Add a regression test only if a concrete boundary failure is found.

**Test gate:** Auth-focused pytest/Jest tests, typecheck and the affected frontend suite.

**Real-interaction space:** Login as student, refresh, visit student routes, logout, retry protected route; repeat with teacher/admin demo accounts. Record visible navigation and HTTP status without recording tokens or passwords.

**Exit:** Student flow is isolated; role behavior is either verified or explicitly blocked.

## Block 3: Catalog and Content Contract

**Purpose:** Distinguish functioning catalog mechanics from trustworthy PAES content.

**Graph targets:** `get_exams`, `get_subjects`, `get_topics`, `get_subjects_with_topics`, `get_exam_questions`, `seed_database`, `map_item_to_question_payload`.

- [ ] Verify exam, subject, topic and question contracts against the real seeded database.
- [ ] Select a small pilot dataset and review statement, alternatives, correct answer, explanation, topic and image manually.
- [ ] Check inactive content filtering, missing images and malformed imported fields.
- [ ] Define a reversible process to deactivate a defective question.

**Test gate:** Catalog tests, seed transformation tests and a focused dataset validation command.

**Real-interaction space:** Student opens catalog, selects subject/topic, receives at least three reviewed questions, sees alternatives/images where expected, and refreshes the page. Record any mismatch between source and rendered content.

**Exit:** A versioned, human-reviewed pilot dataset exists; the mass dataset remains outside the pilot until reviewed.

## Block 4: Quiz, Persistence, Results and Progress

**Purpose:** Verify the core learning transaction from question delivery to durable progress.

**Graph targets:** `next_question`, `submit_answer`, `create_exam_attempt`, `submit_exam_attempt`, `get_attempt_results`, `user_stats`, `update_user_progress`, `QuizPage`, `handleSubmitAnswer`.

- [ ] Trace one complete request path frontend -> BFF -> FastAPI -> database and identify retry/error states.
- [ ] Verify start, answer, feedback, finish, result, refresh and history behavior.
- [ ] Verify repeated submission, invalid question, unauthorized attempt and partial attempt behavior.
- [ ] Add regression coverage only for a reproducible defect.

**Test gate:** Quiz/progress backend tests, frontend tests, typecheck and official smoke scripts.

**Real-interaction space:** Complete a short reviewed quiz in the browser, deliberately refresh after an answer, finish it, revisit results and progress, and confirm the visible state matches the database. Do not use destructive production data.

**Exit:** The student can complete the minimum learning loop without manual intervention.

## Block 5: MAI and Fallback Evaluation

**Purpose:** Separate “AI endpoint works” from “AI response is educationally useful”.

**Graph targets:** `generate_feedback`, `generate_feedback_phase1`, `_get_user_weak_topics`, `_get_user_overall_level`, `_build_personalized_prompt`, `run_pedagogical_loop_stream`, `_fallback_tutor_reply`, `stream_llm_response`.

- [ ] Define reproducible cases for a strong student, weak topic, repeated mistake, empty history and unavailable provider.
- [ ] Inspect data consumed and produced at each MAI layer: data, profile, generation and educational outcome.
- [ ] Verify fallback text, schema, SSE termination, contextual question data and error separation.
- [ ] Evaluate responses with a human rubric: correctness, explanation quality, Socratic behavior, actionability and unsafe/misleading claims.
- [ ] Keep “improves learning” as `NOT_VERIFIED` until a pilot measurement exists.

**Test gate:** AI service tests, fallback tests, frontend chat/explanation tests and typecheck. Provider integration is a separate test and must not be implied by mocks.

**Real-interaction space:** Run the same cases with provider disabled and, only if approved, with a sandbox provider. Save sanitized prompts/responses and human verdicts, never credentials.

**Exit:** Fallback is reliable enough for controlled use and MAI effectiveness is stated as a hypothesis with a measurement plan.

## Block 6: Visual Student Interaction

**Purpose:** Verify what a student actually sees and does, not only HTTP contracts.

- [ ] Install the approved Playwright browser in the isolated environment.
- [ ] Run the student E2E journey on desktop and mobile viewport.
- [ ] Check loading, empty, error, retry, image, formula, feedback, voice-error and navigation states.
- [ ] Record screenshots or sanitized evidence for each failure; do not change UI cosmetically without a user-impacting finding.

**Test gate:** Playwright focused student tests, frontend Jest, lint and typecheck.

**Real-interaction space:** A human follows the journey without developer instructions: login, catalog, quiz, answer, result, progress and tutor. Record where assistance was required.

**Exit:** The demo journey is repeatable without assistance, or each interruption has an owner and mitigation.

## Block 7: Voice as Optional Capability

**Purpose:** Decide whether voice is pilot-critical or an explicitly optional enhancement.

**Graph targets:** `transcribe_audio`, `text_to_speech`, `text_to_speech_openai`, `text_to_speech_elevenlabs`, `useVoice`.

- [ ] Verify MIME handling, unavailable-provider behavior and UI error separation.
- [ ] Test TTS cleanup for mathematical text and Spanish text.
- [ ] Measure whether voice failures leave text tutoring usable.

**Test gate:** Voice backend/frontend tests and typecheck.

**Real-interaction space:** Use microphone and audio in a controlled browser session if providers are configured; otherwise verify the documented fallback/error state. Do not make voice a blocker unless the pilot explicitly depends on it.

**Exit:** `conservar como opcional`, `corregir` or `posponer` is decided with evidence.

## Block 8: Teacher, Administration and Security Review

**Purpose:** Audit secondary roles without allowing them to expand the first student pilot.

**Graph targets:** `list_teacher_courses`, `get_course_detail`, `get_course_topics_performance`, `get_student_stats`, `list_users`, `update_user`, `security_headers_middleware`, `validate_rate_limiter_backend`.

- [ ] Create one module ficha for teacher, administration and security.
- [ ] Check IDOR, role enforcement, rate limiting, sanitized errors, security headers and production Redis requirements.
- [ ] Verify dashboard claims against the queries and data actually available.

**Test gate:** Security, teacher and admin focused tests, then directly affected suites.

**Real-interaction space:** Use separate teacher/admin accounts to view and modify only permitted data; confirm a student cannot see teacher/admin routes. Record expected and actual UI behavior.

**Exit:** Secondary modules receive `conservar`, `corregir`, `posponer` or `migrar`; only blocking findings enter implementation.

## Block 9: Billing, Payments and Operational Boundaries

**Purpose:** Prevent payment models and mocks from being mistaken for a validated commerce flow.

**Graph targets:** `create_payment_order`, `confirm_payment`, `get_payment_status`, `create_invoice_from_payment`, `generate_invoice_pdf`, `BillingPage`, `handleWebpayResponse`.

- [ ] Map create, callback/confirmation, status, invoice history and download paths.
- [ ] Verify state transitions and idempotency in local tests.
- [ ] Mark Transbank connectivity, callback configuration, real transaction, invoice PDF and refund behavior separately.
- [ ] Define whether billing is excluded from the student pilot.

**Test gate:** Payment state/idempotency/security tests. No real transaction is required for the first pilot unless separately approved.

**Real-interaction space:** Execute only sandbox payment testing with approved credentials; otherwise verify the local disabled/error state and document `NOT_VERIFIED` for provider behavior.

**Exit:** Billing is either excluded from the pilot or has sandbox evidence and an operational owner.

## Block 10: Operations, Cost and Recovery

**Purpose:** Make the demo reproducible and the pilot controllable.

- [ ] Verify startup/shutdown, migrations, health/readiness, metrics, logs, correlation IDs and rate limits.
- [ ] Record dependency warnings and npm vulnerabilities without applying automatic fixes blindly.
- [ ] Define AI/voice request limits, cost proxies, emergency provider disablement and rollback.
- [ ] Rehearse backup restore and content deactivation.

**Test gate:** Full backend suite, frontend suite, typecheck, lint, smoke scripts and restore rehearsal.

**Real-interaction space:** Start from a fresh environment, run the student journey, observe logs/metrics, simulate provider absence, stop services and recover from the documented procedure.

**Exit:** A pilot operator can run, observe, stop and recover the system without hidden developer knowledge.

## Block 11: Pilot Decision and Migration Decision

**Purpose:** Decide what is mature enough to use and what should be preserved, corrected, postponed or migrated.

**Files:**

- Create/update: `Investigacion-Cierre-Operativo/06-MATRIZ-DEUDA-TECNICA.md`.
- Create/update: `07-PLAN-DE-ESTABILIZACION.md`, `08-PLAN-DE-PRUEBAS-PILOTO.md`, `09-CRITERIOS-DE-CIERRE.md`, `10-DECISION-MIGRACION.md`.
- Update: `ESTADO-MAESTRO.md` with current evidence and dates.

- [ ] Convert every finding into severity, impact, evidence, owner and decision.
- [ ] Declare demo and pilot status separately.
- [ ] Confirm the minimum pilot includes reviewed content, functioning student flow, fallback, observability, cost limits, feedback channel and content withdrawal.
- [ ] Choose exactly one outcome: `mantener y estabilizar`, `refactorizar gradualmente` or `migrar componentes seleccionados`.
- [ ] Ask Agy/Antigravity for an independent audit before the final decision.

**Test gate:** Repeat only the acceptance commands tied to the final criteria and attach their outputs.

**Real-interaction space:** Run the complete controlled pilot rehearsal with a clean demo account and a human observer. Record assistance requests, failures, latency observations and feedback.

**Exit:** The project has a defensible status, a bounded pilot and no claim stronger than its evidence.

---

## Database Integrity Definition

For this project, database integrity means all of the following are true for the pilot dataset:

- **Structural integrity:** migrations apply cleanly; one expected Alembic head exists; tables, primary keys, foreign keys, unique constraints, checks and required indexes match the application contract.
- **Referential integrity:** no orphan questions, topics, answers, attempts, feedback, progress, payments, invoices, courses or enrollments.
- **Domain integrity:** questions have valid answer sets and topics; attempts and answers have coherent status and ownership; progress derives from existing activity; payment/invoice state transitions are valid.
- **Operational integrity:** seeds are repeatable and idempotent; backup and restore work; migrations and rollback procedures are understood.
- **Security integrity:** users cannot read or mutate another user's attempts, feedback, progress, invoices or profile through identifiers supplied by the client.
- **Content integrity:** every pilot question has human review status, source/version, correct answer, explanation, topic and a reversible active/inactive decision.

The database is not “healthy” merely because PostgreSQL is running, migrations complete or endpoints return `200`.

## Weekly Order

1. Blocks 0 and 1: baseline and database integrity.
2. Blocks 2, 3 and 4: student identity, trusted content and learning transaction.
3. Blocks 5 and 6: MAI evidence and real browser interaction.
4. Blocks 7, 8, 9 and 10: optional/secondary modules and operations.
5. Block 11: pilot and migration decision.

If a block produces a `FAIL_BLOCKING`, stop the next block, create the smallest regression or evidence task, and request Gabriel's scope approval before changing code.

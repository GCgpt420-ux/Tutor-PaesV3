# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository shape

Two apps live under `tutorpaes/` (this is **not** an npm/uv workspace — each app is built and tested independently):

- `tutorpaes/backend` — FastAPI API. Python (3.12 locally, 3.11 in CI), SQLAlchemy 2.0, Alembic, PostgreSQL 16, Redis.
- `tutorpaes/frontend` — Next.js App Router app. React 19, TypeScript, Tailwind 3.

Supporting directories at the repo root:

- `scripts/` — operational bash + one-off Python helpers. `dev-up.sh` / `dev-down.sh` orchestrate the full local stack.
- `DOCS/` (uppercase) — canonical technical documentation (architecture, security, billing, OpenAI setup).
- `docs/` (lowercase) — `docs/NAVIGATION.md` is the repo map; `docs/status/` holds status reports and audits; `docs/superpowers/plans/` holds execution plans.

## Running locally

`scripts/dev-up.sh` is the canonical local demo path. It brings up Postgres via `docker compose`, runs `alembic upgrade head`, runs the seed scripts, then starts uvicorn and `next dev` as background processes (logs and PID files land in `.runtime/`).

- Backend: `http://127.0.0.1:8001` (health at `/api/v1/health/`, docs at `/docs`)
- Frontend: `http://127.0.0.1:3000`
- Flags: `--skip-db`, `--skip-migrate`, `--skip-seed`
- Stop with `scripts/dev-down.sh` (add `--keep-db` to leave Postgres running)

**Port:** the backend runs on `:8001` everywhere for local dev — `dev-up.sh` (`BACKEND_PORT=8001`), the `NEXT_PUBLIC_API_URL` it injects, `tutorpaes/frontend/.env.example`, and the hardcoded fallback in every `app/api/*/route.ts` BFF handler. `:8000` is deliberately avoided because it is taken by Portainer on this machine. `proxy.ts` whitelists both `:8000` and `:8001` in its CSP `connect-src`. When running pieces by hand, keep the frontend's `NEXT_PUBLIC_API_URL` pointed at whatever port the backend is actually on.

First-time setup (from scratch) follows the README "Runbook de Primer Arranque": `cp tutorpaes/backend/.env.example tutorpaes/backend/.env`, edit real keys, `docker compose up -d`, `alembic upgrade head`, then `python -m scripts.seed_paes` / `scripts.seed_questions` / `scripts.seed_user`.

The backend refuses to import without at least `DATABASE_URL` and `SECRET_KEY` set — `settings.validate_runtime_requirements()` runs at module load in `app/main.py`.

## Commands

### Backend (run from `tutorpaes/backend`)

| Task | Command |
|---|---|
| Run tests | `python -m pytest -q` |
| Single test | `python -m pytest tests/test_quiz/test_quiz.py::test_name -q` |
| Import smoke check (matches CI) | `python -c "from app.main import app; print(app.title)"` |
| Compile check (matches CI) | `python -m compileall app scripts` |
| Apply migrations | `python -m alembic upgrade head` |
| New migration | `python -m alembic revision --autogenerate -m "describe change"` |

Tests run against in-memory SQLite with FastAPI's `TestClient`. `tests/conftest.py` sets `DATABASE_URL`, `SECRET_KEY`, `PAYMENT_RETURN_URL`, and `ENVIRONMENT=test` as defaults, so no real database or `.env` is needed to run them. `pytest.ini` sets `asyncio_mode=auto` and `pythonpath=.`.

Two virtualenvs exist in the backend directory (`venv/` and `.venv/`); `dev-up.sh` uses `venv/`.

### Frontend (run from `tutorpaes/frontend`)

| Task | Command |
|---|---|
| Dev server | `npm run dev` (deliberately `next dev --webpack`, not turbopack) |
| Production build | `npm run build` |
| Lint | `npm run lint` |
| Type check | `npm run typecheck` (`tsc --noEmit`) |
| Unit tests | `npm test` (Jest) |
| Single unit test | `npx jest src/features/auth/foo.test.tsx -t "test name"` |
| E2E | `npm run test:e2e` (Playwright, specs in `e2e/`) |
| Regenerate API types | `npm run gen:api` (curls backend OpenAPI on `:8001` → `src/lib/api/types.ts`) |

## Backend architecture

- **`app/main.py`** — one FastAPI app. Every router is mounted under `/api/v1`; Prometheus metrics are a mounted ASGI app at `/metrics`. Two HTTP middlewares: security headers, and a correlation-id middleware that reads/generates `X-Request-ID` and stores it in a contextvar (`app/core/request_context.py`). Global exception handlers normalize **every** error to `{"error", "detail", "request_id"}` — preserve this shape when adding endpoints. Lifespan startup optionally runs `create_all` (only if `AUTO_CREATE_TABLES`) and prunes expired revoked JWTs.

- **`app/api/v1/endpoints/`** — one module per domain: `auth`, `catalog`, `quiz`, `questions`, `ai`, `ai_chat`, `payments`, `admin`, `voice`, `teacher`, `health`.

- **`app/services/`** — business logic. The LLM abstraction is the architectural centerpiece:
  - `llm_provider_service.py` — `LLMProvider` base class with `OpenAIProvider` / `GroqProvider` / `CerebrasProvider` subclasses. `get_llm_provider()` is a factory keyed on `settings.LLM_PROVIDER`. `stream_llm_response()` is the main entry point: it tries the configured provider, then **automatically falls back** to any other provider whose API key is present. Each provider call is wrapped in a per-provider `CircuitBreaker` (`app/core/circuit_breaker.py`) plus a `tenacity` retry, and returns a streaming generator (SSE). Chat controllers depend on this factory, never on a concrete provider.
  - `chatbot_service.py`, `ai_service.py`, `openai_service.py` — chat/tutor orchestration.
  - `invoice_service.py`, `transbank_service.py` — billing and Transbank Webpay payments (stub-friendly for local/integration).
  - `user_progress_service.py` — quiz progress and topic mastery.
  - `email.py` — `aiosmtplib` transactional email (password reset).

- **`app/core/`** — cross-cutting concerns: `config.py` (pydantic-settings, fully env-driven; normalizes `postgres://` / `postgresql://` URLs to `postgresql+psycopg://`; `validate_runtime_requirements()` enforces required vars and a production guardrail that `TBK_ENVIRONMENT` must be `production`), `auth.py` (JWT issue/verify, revoked-token table), `rate_limiter.py` (slowapi; expects `REDIS_URL` in production/staging, warns and falls back to in-memory otherwise), `metrics.py`, `key_management.py`, `validators.py`.

- **`app/db/models.py`** — ~25 SQLAlchemy models grouped as: content (`Exam`, `Subject`, `Topic`, `Question`, `QuestionChoice`), users/progress (`User`, `UserEntitlement`, `UserProgress`, `StudySession`), attempts (`Attempt`, `AttemptFeedback`), AI (`ChatMessage`, `AIUsageLog`, `QuestionExplanation`), billing (`Payment`, `Invoice`), auth (`RevokedToken`), teacher (`Course`, `CourseEnrollment`). Engine and `SessionLocal` in `app/db/session.py`. Schema changes go through Alembic (`migrations/versions/`), not model edits alone.

## Frontend architecture

- **App Router split:** `app/` holds routes only; `src/` holds all feature code. Public routes are directly under `app/`; authenticated routes are under `app/protected/*` (dashboard, quiz, ensayos, ranking, progreso, perfil, billing, admin, cursos).

- **BFF proxy layer:** `app/api/*/route.ts` are server routes that forward to the FastAPI backend, reading the `access_token` httpOnly cookie and forwarding it as `Authorization: Bearer`. `app/api/backend/[...path]/route.ts` is a generic catch-all pass-through that preserves streaming responses (SSE for AI chat). Dedicated routes handle `auth/{login,logout,refresh,register}`, `ai/explain`, and `payments/{create,confirm}`. The browser never calls the FastAPI backend directly.

- **`proxy.ts`** is the Next middleware in everything but filename (it exports `proxy` and a `config.matcher`). It builds a per-environment CSP (production drops `unsafe-eval`; `form-action` allows the Transbank Webpay domains), redirects unauthenticated hits on `/protected` to `/auth/login`, clears cookies and redirects when the access token is expired with no refresh token, and bounces already-authenticated users away from `/auth/login` and `/auth/sign-up`.

- **`src/features/<domain>/`** — co-located UI + hooks per domain (`ai`, `auth`, `courses`, `dashboard`, `exams`, `home`, `onboarding`, `pricing`, `profile`, `ranking`). `src/components/ui/` — shadcn-style Radix primitives. `src/lib/api/` — typed client (`client.ts`) plus generated `types.ts`. `src/lib/server/auth-session.ts` and `src/lib/auth/current-user.ts` — server-side session helpers.

- **Design system:** use the semantic Tailwind tokens defined in `tailwind.config.ts` (e.g. `bg-surface-elevated`) rather than hardcoded colors — hardcoded values break the premium dark mode.

- **Rendering libs:** math via `katex` + `remark-math` / `rehype-katex`; markdown via `react-markdown`; server state via `@tanstack/react-query`; edge rate limiting via `@upstash/ratelimit`.

## Conventions and gotchas

- Error payloads across the backend are always `{error, detail, request_id}` — new handlers must match.
- Never commit OpenAI / Groq / Cerebras / Transbank keys. They are read only through `settings` / `os.getenv`; templates live in `.env.example`.
- New status or audit `.md` files belong in `docs/status/`, not the repo root (see `docs/NAVIGATION.md`).
- CI (`.github/workflows/ci.yml`, `backend-ci.yml`, `frontend-ci.yml`) runs backend pytest on SQLite + Python 3.11 and frontend Jest on Node 20; there are also `e2e.yml`, `security-ci.yml`, `a11y-storybook.yml`, `db-backup.yml`.
- The active LLM provider and its fallbacks are driven entirely by `LLM_PROVIDER` and which `*_API_KEY` values are set — there is no per-request provider override in the chat controller.

## Importing other agent configs

An OpenAI Codex config (`~/.codex/config.toml`, `~/.codex/AGENTS.md`) and a Gemini CLI config (`~/.gemini/settings.json`, `~/.gemini/GEMINI.md`) exist on this machine. To pull user-level items (MCP servers, slash commands, subagents, skills, instructions) into Claude Code, reply `/import` to scan and list what is importable, then `/import --yes=<digest>` (the scan names the digest) to apply. If `/import` is unavailable here, run `claude import` from a terminal.

# CivicDigest — AI Agent Development Guidelines (AGENTS.md)

Welcome, AI Agent (Google Jules, Claude, Gemini, Antigravity). This repository is **CivicDigest**, a civic-tech municipal transparency platform and data pipeline.

Follow the architectural boundaries, command standards, and verification checklist below to ensure high-velocity, error-free pull requests.

---

## 1. Monorepo Architecture & Directory Map

```
civic-digest/
├── AGENTS.md                  # Root agent steering rules (this file)
├── .Jules/                    # Persistent agent learnings & design rules
│   ├── palette.md             # UI/UX design & accessibility rules
│   └── instructions.md        # Jules task execution workflow
├── .github/                   # CI/CD and automation workflows
│   ├── workflows/
│   │   ├── ci.yml             # Fast PR verification (Frontend, Backend, Docs)
│   │   ├── jules-dispatch.yml # Autonomous issue & comment task dispatcher
│   │   ├── jules-batch.yml    # Batch task queue runner (up to 15 concurrent)
│   │   └── deploy-docs.yml    # Documentation deployer
│   └── ISSUE_TEMPLATE/        # Structured AI task templates
├── frontend/                  # Next.js 16 App Router web application
│   ├── package.json           # Dependencies managed strictly with Bun
│   ├── bun.lock               # Bun lockfile
│   ├── src/
│   │   ├── app/               # Next.js App Router routes & API endpoints
│   │   ├── components/        # React 19 UI components
│   │   ├── db/                # Client-side DB & repository abstraction
│   │   ├── lib/               # Utility functions & Zustand stores
│   │   ├── types/             # TypeScript OCD schemas & civic types
│   │   └── tests/             # Fast Bun smoke & unit tests
├── backend/                   # FastAPI Python microservice
│   ├── main.py                # FastAPI app entry point
│   ├── models.py              # Pydantic schemas & SQLAlchemy ORM models
│   ├── database.py            # PostgreSQL connection with safe fallback
│   ├── scrapers/              # Municipal ingestion pipelines (Legistar OData)
│   │   ├── legistar.py        # Asynchronous OData HTTP client
│   │   ├── normalizer.py      # OCD-ID v3 generator & HTML cleaner
│   │   └── pipeline.py        # Ingestion orchestrator
│   └── tests/                 # Pytest test suite
├── docs/                      # MkDocs documentation site
└── vercel.json                # Vercel deployment configuration
```

---

## 2. Runtime & Command Rules

### Frontend (`frontend/`)
- **Runtime**: **Bun** (v1.2+). **NEVER** run `npm`, `npx`, `yarn`, or `pnpm`. Always use `bun` or `bun x`.
- **Install Dependencies**: `bun install` (or `bun add <pkg>`)
- **Development Server**: `bun dev`
- **Lint Check**: `bun run lint`
- **Type Check**: `bun x tsc --noEmit`
- **Production Build**: `bun run build`
- **Unit / Smoke Tests**: `bun test`

### Backend (`backend/`)
- **Runtime**: **Python 3.12+**.
- **Virtual Environment**: Use `.venv` if present or system Python.
- **Install Dependencies**: `pip install -r requirements.txt -r requirements-dev.txt`
- **Run Server**: `uvicorn backend.main:app --reload` (or `uvicorn main:app --reload` from `backend/`)
- **Linting & Formatting**: `ruff check backend/`
- **Unit Tests**: `pytest backend/tests/ -v`

### Documentation (`docs/`)
- **Build / Serve**: `mkdocs serve` or `mkdocs build --strict`

---

## 3. Core Coding Conventions & Guardrails

### Frontend Conventions
1. **React Rules of Hooks**:
   - NEVER call hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) conditionally or after early returns (e.g. `if (!isOpen) return null;`). All hooks MUST remain top-level in the component.
   - Declare helper functions before invoking them in `useEffect` or wrap them in `useCallback`.
2. **Accessibility**:
   - All icon-only buttons (such as `<X />` close buttons) MUST have an explicit `aria-label` (e.g., `aria-label="Close modal"`).
   - Ensure proper heading hierarchy (`h1` -> `h2` -> `h3`).
3. **Styling**:
   - Use Tailwind CSS v4 utility classes. Avoid arbitrary inline styles.
   - Support dark mode and maintain semantic color tokens.
4. **TypeScript**:
   - Avoid `any` where possible. Use defined types in `src/types/` or interface definitions.

### Backend Conventions
1. **Open Civic Data (OCD-ID v3) Compliance**:
   - Bill IDs must be generated using `generate_ocd_bill_id(year, state, place, bill_identifier)`.
   - Topic classifications follow standard categories (`Zoning & Land Use`, `Environment & Infrastructure`, `Budget & Appropriations`, etc.).
2. **Database Fallback**:
   - Scrapers and API endpoints must never crash if PostgreSQL is disconnected. Always support in-memory fallback mode (`completed_in_memory: true`).
3. **Async / HTTP**:
   - Use `httpx.AsyncClient` for external API requests with appropriate timeouts (default 15s).

---

## 4. Code Review & Simplicity Gate (Two-Pass Review)

Agents must review their own staged diff before committing code to ensure clean, maintainable architecture:

### Pass 1: Ponytail Review (Anti-Overengineering & YAGNI Hunt)
- **`delete:`** Cut dead code, unused flexibility, speculative features, or configuration options nobody requested.
- **`stdlib:`** Reach for the standard library before pulling in third-party dependencies (e.g. `urllib.parse`, `json`, `datetime`, `re`, `pathlib`, `xml.etree.ElementTree`, `io.BytesIO`).
- **`native:`** Use native platform, CSS, and framework capabilities rather than external utility libraries.
- **`yagni:`** Eliminate premature abstractions with only one implementation, single-caller wrapper classes, or unnecessary indirection.
- **`shrink:`** Compress verbose boilerplate into idiomatic, readable code (`net: -<N> lines`). Lean code ships faster and breaks less.

### Pass 2: Regular Quality & Correctness Review
- **Error Boundaries:** Ensure graceful fallbacks (e.g. database disconnects fall back to in-memory mode, API network failures handle timeouts).
- **Domain Standards:** Verify OCD-ID v3 compliance and strict adherence to the Receipt Verification Protocol (never omit primary source citations).
- **Type Safety & Linting:** 100% type coverage, 0 lint warnings (`ruff check` or `bun run lint`).

---

## 5. Git Commit Protocol & Reviewability Rules

To keep pull requests trackable and prevent review fatigue:

1. **Diff Size Hard Ceiling (< 600 lines):**
   - **NO COMMIT MAY EXCEED 600 LINES OF DIFF.**
   - Target bite-sized, atomic commits between **150 and 350 lines**.
   - Always run pre-commit diff checks before committing:
     ```bash
     git diff --cached --stat
     ```
   - If changes approach 500 lines, split the work into separate logical commits (e.g. interfaces/schemas first, implementation second, tests third).

2. **Commit Often with Clear, Concise Messages:**
   - Use Conventional Commit format: `<type>(<scope>): <imperative summary>` (≤50 chars subject, no trailing period).
   - Valid types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`.
   - Examples:
     - `feat(bot): add municipal pdf text extraction pipeline`
     - `test(bot): add synthetic pdf parsing unit tests`
     - `fix(scrapers): handle missing legistar matter attachment dates`

3. **Quality Gate:**
   - Every commit must compile and pass relevant tests before being recorded. Never commit broken code.

---

## 6. Mandatory Definition of Done (Pre-PR Checklist)

Before creating or updating a Pull Request, agents **MUST** execute and pass these gates:

1. **Frontend Verification**:
   ```bash
   cd frontend
   bun run lint
   bun run build
   bun test
   ```
   *Expected: 0 lint errors, build compiles successfully, all bun tests pass.*

2. **Backend Verification**:
   ```bash
   cd backend
   ruff check .
   pytest tests/ -v
   ```
   *Expected: All ruff checks pass, all pytest test cases pass.*

3. **Review & Diff Check**:
   - Run Ponytail Review pass (cut over-engineering, unneeded deps, and boilerplate).
   - Run `git diff --stat origin/main...HEAD` to verify all individual commits remain under the 600-line reviewability ceiling.

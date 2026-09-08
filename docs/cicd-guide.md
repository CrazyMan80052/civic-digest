# CI/CD & Autonomous AI Agent Pipeline Guide

CivicDigest features a modern CI/CD pipeline tailored specifically for **rapid iteration with AI coding agents** (such as Google Jules, Claude, and Gemini).

---

## 1. Architecture Overview

```
                                  GitHub Repository
                       ┌─────────────────────────────────────┐
                       │ Issues / PRs / Backlog Queue        │
                       └──────────────────┬──────────────────┘
                                          │
                         [Trigger: 'jules' label or /jules]
                                          ▼
                       ┌─────────────────────────────────────┐
                       │ Jules Dispatcher (GitHub Actions)   │
                       │ - Authenticates via JULES_API_KEY   │
                       │ - Enforces security allowlist       │
                       │ - Injects AGENTS.md instructions    │
                       └──────────────────┬──────────────────┘
                                          ▼
                       ┌─────────────────────────────────────┐
                       │ Google Jules Agent (Cloud VM)       │
                       │ - Reads monorepo architecture       │
                       │ - Implements changes                │
                       │ - Self-verifies build & tests       │
                       │ - Opens Pull Request                │
                       └──────────────────┬──────────────────┘
                                          ▼
                       ┌─────────────────────────────────────┐
                       │ Monorepo CI Pipeline (ci.yml)       │
                       │ - Frontend: Bun, tsc, lint, build   │
                       │ - Backend: Python 3.12, ruff, pytest│
                       │ - Docs: MkDocs strict build         │
                       └───────────┬─────────────────────────┘
                                   │
              Pass ┌───────────────┴───────────────┐ Fail
                   ▼                               ▼
       ┌───────────────────────┐       ┌───────────────────────┐
       │ Vercel Preview Deploy │       │ CI Failure Reporter   │
       │ (Instant live preview)│       │ (One-click auto-heal) │
       └───────────────────────┘       └───────────────────────┘
```

---

## 2. Setting Up Google Jules Integration

### Step 1: Obtain Your Jules API Key
1. Visit [jules.google.com](https://jules.google.com) and log in with your Google Account.
2. In your account settings, locate the **API Keys** section and generate a new key.

### Step 2: Store in GitHub Repository Secrets
1. In your GitHub repository, navigate to:
   **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**.
3. Name: `JULES_API_KEY`
4. Value: *paste your generated key*

---

## 3. How to Trigger Jules Tasks

### Option A: Issue-Driven Dispatch (Recommended)
1. Open a new issue using the **🤖 Jules AI Task** issue template.
2. Fill in the objective, target files, and acceptance criteria.
3. The issue will automatically receive the `jules` label.
4. GitHub Actions will trigger Jules, post an acknowledgment comment, and Jules will open a Pull Request once completed.

### Option B: Slash Command Trigger (`/jules`)
Comment anywhere on an open Issue or Pull Request:
```text
/jules Add an integration test in backend/tests/test_api.py for the preview-odata endpoint.
```
Jules will immediately spin up a cloud VM, implement the request, and push commits to the PR branch or create a new branch.

### Option C: Batch Execution (Burning 100 Tasks/Day)
Jules on Google AI Pro provides **100 tasks/day** and up to **15 concurrent tasks**.

To execute multiple tasks simultaneously:
1. Review `.github/jules-tasks.json` or add new items with `"status": "pending"`.
2. In GitHub, go to **Actions** → **Jules — Batch Task Runner**.
3. Click **Run workflow**, set `max_concurrent` (up to 15), and click **Run**.
4. Up to 15 tasks will execute in parallel across independent Jules cloud VMs!

### Option D: Automated Post-Merge Documentation Sync
Whenever any Pull Request is merged into `main`, GitHub Actions automatically dispatches Jules via `.github/workflows/jules-docs-sync.yml`.
- **Scope Analysis:** Jules examines the PR's code diff across `frontend/`, `backend/`, and configuration files.
- **Documentation Audit:** Jules compares the merged changes against `docs/` and `mkdocs.yml` to identify new endpoints, updated schemas, new UI components, or modified workflows.
- **Self-Healing PR:** If updates are warranted, Jules commits the updated markdown files, verifies `mkdocs build --strict`, and opens a targeted documentation PR.
- **Loop Prevention & Guardrails:** Automatically skips PRs authored by Jules (`google-labs-jules[bot]`), PRs that only touched `docs/`, or PRs tagged with the `skip-docs` label.

---

## 4. Pull Request CI Gates

Every PR must pass the following verification checks in `.github/workflows/ci.yml`:

| Subsystem | Tools & Commands | Expected Result |
| :--- | :--- | :--- |
| **Frontend** | `bun x tsc --noEmit`<br>`bun run lint`<br>`bun run build`<br>`bun test` | 0 type errors, 0 lint errors, build succeeds, all Bun tests pass. |
| **Backend** | `ruff check .`<br>`pytest tests/ -v` | 0 ruff errors/warnings, all Pytest test cases pass. |
| **Docs** | `mkdocs build --strict` | Clean documentation build with no broken links. |

---

## 5. Deployment Pipelines

### Frontend: Vercel Preview & Production
- **Preview Deployments:** Every PR opened by Jules or team members automatically triggers a Vercel preview deployment with an isolated URL.
- **Production Deployment:** Merging into `main` deploys directly to production.
- **Settings:** Configured via `vercel.json` in repository root.

### Backend: Containerization & Cloud Run / PaaS
- **Dockerfile:** A production-ready multi-stage container is available at `backend/Dockerfile`.
- **Health Check:** `/api/health` validates API responsiveness and standards compliance.
- **Deploy:** Can be deployed to Google Cloud Run, Render, Fly.io, or Railway with a single command or GitHub Actions hook.

### Documentation: GitHub Pages & Jules Auto-Sync
- **Automatic Deployment:** `deploy-docs.yml` automatically builds and deploys documentation to GitHub Pages whenever changes land in `docs/**` or `mkdocs.yml` on `main`.
- **Autonomous Synchronization:** `jules-docs-sync.yml` dispatches Jules to review merged code changes and keep documentation continuously up-to-date.

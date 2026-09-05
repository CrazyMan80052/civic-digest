# Jules Task Execution Instructions

When assigned an issue or task in **CivicDigest**, follow this exact workflow:

## Step 1: Read & Scope
1. Examine the issue prompt, acceptance criteria, and target files.
2. Read `AGENTS.md` for project-wide conventions.
3. Review `.Jules/palette.md` for past learnings and accessibility guidelines.

## Step 2: Implement
1. Modify or create files following the monorepo conventions:
   - Frontend: TypeScript, React 19, Next.js App Router, Tailwind CSS v4. Use `bun` exclusively.
   - Backend: Python 3.12, FastAPI, Pydantic, SQLAlchemy.
2. Keep edits minimal, focused, and surgical to the requested objective.
3. If creating UI components:
   - Provide explicit `aria-label`s on icon-only buttons.
   - Declare all hooks before any early returns.
   - Ensure proper contrast and responsive styling.

## Step 3: Self-Verification
Before submitting your changes as a Pull Request, run the corresponding verification suites:
- **Frontend changes**:
  ```bash
  cd frontend
  bun run lint
  bun run build
  bun test
  ```
- **Backend changes**:
  ```bash
  cd backend
  ruff check .
  pytest tests/ -v
  ```
If any check fails, fix the errors before concluding the task.

## Step 4: Pull Request Delivery
- Use a clear, conventional branch name (e.g. `jules/feature-name` or `jules/fix-issue-12`).
- Include a descriptive PR title (e.g. `feat(scrapers): add Austin Legistar pipeline`).
- In the PR body, summarize:
  - **What changed**: bullet points of files and modifications.
  - **Verification**: confirmation that `bun run build` / `pytest` passed.
  - **Closes**: link to the GitHub issue (e.g. `Closes #123`).

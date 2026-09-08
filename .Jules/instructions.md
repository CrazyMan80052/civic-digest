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

## Step 3: Self-Verification & Upstream Sync
Before submitting your changes as a Pull Request, guarantee clean mergeability with `main` and execute the local CI test suites:

1. **Sync with Main & Conflict Check**:
   ```bash
   git fetch origin main
   git merge origin/main
   git diff --check
   ```
   *Expected: Zero merge conflicts and no conflict markers.*

2. **Frontend changes**:
   ```bash
   cd frontend
   bun install --frozen-lockfile
   bun x tsc --noEmit
   bun run lint
   bun run build
   bun test
   ```

3. **Backend changes**:
   ```bash
   cd backend
   ruff check .
   pytest tests/ -v
   ```

If any check fails, fix the errors before concluding the task.

## Step 4: Automated Pull Request Delivery
1. Push branch to remote:
   ```bash
   git push -u origin HEAD
   ```
2. Automatically create the PR using `gh pr create` with the standardized template from `AGENTS.md`:
   ```bash
   gh pr create \
     --title "<type>(<scope>): <concise imperative summary>" \
     --body "$(cat <<'EOF'
   ## Summary of Changes
   - <Bullet point of change>

   ## Related Issue
   Closes #<issue_number>

   ## Pre-PR & CI Verification Checklist
   - [x] Synced with `origin/main` (0 merge conflicts)
   - [x] Frontend checks passed (`bun x tsc`, `bun run lint`, `bun run build`, `bun test`)
   - [x] Backend checks passed (`ruff check .`, `pytest tests/ -v`)
   - [x] Ponytail Simplicity Gate passed (<600 lines diff)

   ## Verification Evidence
   - All tests passing, builds cleanly without errors.
   EOF
   )"
   ```
3. Confirm mergeability:
   ```bash
   gh pr view --json mergeable
   ```

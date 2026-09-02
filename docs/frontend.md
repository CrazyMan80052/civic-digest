# Frontend Documentation

The frontend of CivicDigest is built using **Next.js** (App Router) and uses the **Bun** runtime for package management and script execution.

## Tech Stack

- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS (configured with PostCSS)
- **Font:** Geist (Optimized via `next/font`)
- **Package Manager / Runtime:** Bun

## Getting Started

To run the development server, navigate to the `frontend` directory and use Bun:

```bash
cd frontend
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Development Rules

As specified in `frontend/AGENTS.md`, this project uses a newer version of Next.js that may contain breaking changes regarding APIs, conventions, and file structure. Ensure you read the relevant guide in `node_modules/next/dist/docs/` before making any code modifications.

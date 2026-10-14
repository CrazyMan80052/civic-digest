# Elections guide MVP plan

## Goal

Add a separate `/elections` page to CivicDigest that helps Ohio residents open an official sample ballot, select civic issues they care about, and compare published candidate positions with clear source links.

## First release

- Pilot on the November 3, 2026 Union County general election.
- Use the Board of Elections ballot-style list and a clearly labeled Dublin City 2 example ballot. Direct the visitor to the official voter lookup when they need a voter-specific style; CivicDigest does not collect voter identity or address data.
- Show the governor and lieutenant governor contest from the example ballot, with factual position summaries linked to campaign sources.
- Leave gaps explicit when a reviewed source does not support an issue summary. Do not infer a stance, produce an endorsement, or rank candidates.
- Let visitors select issue topics and store those selections in browser local storage only. No profile API, Gemini request, database, analytics, or election scraper is required for this release.
- Add navigation from both the existing root page and the new page.

## Build sequence

1. Establish the standalone page, Ohio/Union ballot entry points, and local-only topic selection.
2. Add one carefully sourced statewide contest as the comparison example and display the source review date.
3. Check the page at desktop and mobile widths, verify official links and accessibility labels, and run the frontend production build and lint.
4. Add counties and local contests only after an official, maintainable source and update process are identified for each county.

## Later work

- Create election-specific data types for election, ballot style, contest, candidate, issue, position, and source record.
- Add source freshness and revision history; keep each claim linked to the primary record and retrieval date.
- Expand county by county, with explicit coverage notes and a fallback to the relevant official board of elections.
- Consider optional private account syncing only after consent, retention, and deletion behavior are designed. Keep ballot lookup identity separate from issue preferences.

## Cost boundary

The MVP is static frontend data plus links to official public pages. It introduces no paid API, database, AI call, Vercel product, or deployment change. A GitHub PR and existing CI checks may run under the repository's current configuration; no new paid integration is added.


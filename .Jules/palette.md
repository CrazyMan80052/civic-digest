## 2024-09-04 - Modal Close Button Accessibility
**Learning:** Found several modal/drawer components using icon-only (<X />) buttons for closing without aria-labels, making them inaccessible to screen readers.
**Action:** Always ensure icon-only buttons have descriptive aria-labels (e.g., aria-label="Close") to maintain accessibility across the design system.

## 2024-09-05 - React Hook Positioning in Modals
**Learning:** Early returns (e.g., `if (!isOpen) return null;`) placed before `useState` or `useEffect` hook calls violate React's Rules of Hooks and cause runtime errors when modal visibility toggles.
**Action:** Always declare all hooks at the very top of the functional component before any conditional rendering or early returns.

## 2024-09-05 - Async Scraper In-Memory Fallback
**Learning:** In dev and CI environments, PostgreSQL may not always be running or accessible. Crashing on DB failure halts scraper runs.
**Action:** Always wrap DB operations with fallback mechanisms so scrapers return parsed OCD-ID records in-memory if DB transactions fail.

## 2024-09-05 - Runtime Discipline with Bun
**Learning:** Using npm/yarn/pnpm in `frontend/` causes conflicting lockfiles and breaks Turbopack caches.
**Action:** Exclusively use `bun` commands (`bun install`, `bun dev`, `bun run build`, `bun test`) in the frontend directory.

## 2024-05-14 - Accessible Form Controls in Next.js Components
**Learning:** Found that custom dropdowns (`<select>`) and utility buttons (like a search clear "✕" button) in `Navbar.tsx` were missing accessible names. Screen readers rely on `aria-label` when visual labels are omitted or placed via icons without text alternatives.
**Action:** Always add explicit `aria-label` attributes to `<input>`, `<select>`, and icon-only `<button>` elements in interactive components.

## 2024-09-10 - Button Accessibility in Banners
**Learning:** Found several buttons in `PersonalizedRecommendationsBanner.tsx` lacking `type="button"`, causing potential form submission issues, and missing `focus-visible` styles for keyboard navigation.
**Action:** Always add `type="button"` to non-submit buttons and include explicit `focus-visible` styles (`focus:outline-none focus-visible:ring-2 focus-visible:ring-[color] focus-visible:ring-offset-1`) for keyboard accessibility.
## 2026-09-09 - Explicit Form Label Binding
**Learning:** Found inputs in `UserProfileModal.tsx` relying on implicit wrapping for labels instead of explicit `htmlFor` and `id` bindings. This degrades screen reader experience and click target areas.
**Action:** Ensure all `<label>` elements use `htmlFor` explicitly linked to the `id` of their corresponding form control for better a11y.
## 2024-03-24 - Accessibility and Focus Management for Utility Icon Buttons
**Learning:** Icon-only buttons used for utility functions (like "Copy to clipboard") frequently miss accessibility requirements when placed inside complex instructional modal layouts. Without `aria-label` screen reader users receive no context, and without proper `focus-visible` states, keyboard navigation is unclear against the modal's background styling.
**Action:** Always ensure that every icon-only button—especially utility buttons in helper modals (e.g. copying connection strings)—includes an explicit, descriptive `aria-label` and has a `focus-visible` styling (like `focus-visible:ring-2`) matching the application's design system pattern.

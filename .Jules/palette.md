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
## 2026-10-01 - Range Input Accessibility
**Learning:** Native `<input type="range">` elements require visible focus indicators for keyboard users to navigate smoothly. Avoid explicitly defining `aria-valuemin`, `aria-valuemax`, and `aria-valuenow` for these inputs, as screen readers can natively infer these values from the standard `min`, `max`, and `value` attributes. Also, use `focus:outline-none` in Tailwind instead of hallucinating classes like `focus:outline-hidden` to ensure native outlines are correctly overridden before applying custom focus rings.
**Action:** When styling range inputs, always apply a custom focus ring (e.g., `focus:outline-none focus-visible:ring-2 focus-visible:ring-[color]`) and an `aria-label`. Exclude redundant ARIA value attributes if the native attributes (`min`, `max`, `value`) are already present.

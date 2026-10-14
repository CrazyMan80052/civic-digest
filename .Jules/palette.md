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
## 2024-05-19 - Accessible Range Inputs in Modals
**Learning:** Custom range inputs (`<input type="range">`) often lack proper focus states in Tailwind applications, especially when combined with custom accent colors. Furthermore, without explicit ARIA labels and value constraints (`aria-valuemin`, `aria-valuemax`, `aria-valuenow`), they remain opaque to screen readers because visual indicators (like adjacent labels or dynamic text updates) aren't directly associated.
**Action:** When implementing or refactoring range inputs, always ensure they are accompanied by: `aria-label`, `aria-valuemin`, `aria-valuemax`, and `aria-valuenow` attributes. To support robust keyboard navigation, consistently apply `focus:outline-none focus-visible:ring-2 focus-visible:ring-[ACCENT_COLOR]` to match the application's design system focus indicators.
## 2024-10-24 - Accessibility Standards for Custom Tabs
**Learning:** The `ResidentMicroSurveyModal` component previously implemented custom tabs using basic buttons inside a div and relied on React conditional unmounting to switch views. This approach violates standard WCAG guidelines for screen readers, as they require explicit `role='tablist'` structures to parse the relationship between tab controls and their panels, compute total tabs, and correctly announce the state. Conditional unmounting removes non-active panels from the DOM, breaking `aria-controls` associations for screen readers.
**Action:** Use native HTML `hidden={boolean}` attribute for non-active `tabpanel` elements instead of conditional unmounting in React, which preserves the DOM structure so screen readers can interpret hidden tab panels safely. Always wrap custom tab buttons in a `role='tablist'` div and assign the buttons `role='tab'`, `aria-selected`, and `aria-controls`. Link them to the respective `role='tabpanel'` components with corresponding `id` and `aria-labelledby` properties.
## 2024-09-19 - Loading State Feedback for Async Actions
**Learning:** Found that long-running operations like `handleSave` in `UserProfileModal.tsx` did not provide visual feedback, allowing users to rapidly click multiple times while saving.
**Action:** Always add loading states (e.g., `isSaving`) to `async` interactions and show a visual indicator (like a spinner and updated text) while disabling the button to prevent multiple submissions.

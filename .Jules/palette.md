## 2024-09-04 - Modal Close Button Accessibility
**Learning:** Found several modal/drawer components using icon-only (<X />) buttons for closing without aria-labels, making them inaccessible to screen readers.
**Action:** Always ensure icon-only buttons have descriptive aria-labels (e.g., aria-label="Close") to maintain accessibility across the design system.
## 2024-05-14 - Accessible Form Controls in Next.js Components
**Learning:** Found that custom dropdowns (`<select>`) and utility buttons (like a search clear "✕" button) in `Navbar.tsx` were missing accessible names. Screen readers rely on `aria-label` when visual labels are omitted or placed via icons without text alternatives.
**Action:** Always add explicit `aria-label` attributes to `<input>`, `<select>`, and icon-only `<button>` elements in interactive components.

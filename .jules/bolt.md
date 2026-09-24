## 2024-05-18 - DocketCard Re-rendering Optimization
**Learning:** `DocketCard` is rendered inside a large list (`filteredBills.map`). In the current implementation, every state change in the parent `page.tsx` causes all `DocketCard` components to re-render, creating a performance bottleneck when filtering or interacting with other UI elements. Passing inline arrow functions like `onSelectTag={(tag) => setSearchQuery(tag)}` prevents memoization from working because a new function reference is created on every render.
**Action:** Used `React.memo` on `DocketCard` and `React.useCallback` for event handlers (`handleShareBill`, `handleOpenMicroSurvey`, `handleOpenReceipt`, `handleOpenPerspectives`) in the parent to maintain referential equality, combined with passing `setSearchQuery` directly, significantly reducing unnecessary list item re-renders.

## 2024-09-24 - Array Filtering Optimization
**Learning:** In React functional components with multiple state variables (`PolicyIntelPlatform`), array computations like `bills.filter` executed inline will recalculate on every render, even when the underlying data (`bills` or `filterCategory`) hasn't changed.
**Action:** Consistently use `useMemo` for any non-trivial data transformations or filtering operations on lists passed as props, ensuring referential equality and preventing unnecessary CPU cycles during unrelated state updates.

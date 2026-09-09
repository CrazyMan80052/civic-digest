## 2025-09-09 - Missing memoization for list components
**Learning:** Found a performance bottleneck where updating modal state in the main `App` component caused all `DocketCard` list items to re-render, as event handlers passed as props were re-created on each render.
**Action:** Always extract inline functions into `useCallback` when passing them as props to list items and wrap the child component in `React.memo` to prevent unnecessary re-renders of the list.

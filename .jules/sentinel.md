## 2025-02-18 - [Missing noopener on external link]
**Vulnerability:** External link with `target="_blank"` was missing `rel="noopener"`.
**Learning:** React handles `target="_blank"` securely, but it's important to also have the `noopener` set explicitly as best practice when using `noreferrer` especially in older browsers to prevent Reverse Tabnabbing.
**Prevention:** Always add `rel="noopener noreferrer"` for `target="_blank"` links that lead outside the application domain.

---
'@fast-check/worker': patch
'@fast-check/jest': patch
'@fast-check/vitest': patch
---

Restore compatibility with fast-check v4 while retaining support for the property and execution-context APIs on main. Derive shared types from APIs available in both versions, select the correctly typed async property factory, and preserve the expected shrink stream for worker-generated values.

Expose matching CommonJS declarations for worker and Vitest so arbitraries imported directly from fast-check v4 remain assignable in either module system.

---
'@fast-check/codemod': patch
---

Make `v5/checkToAssert` work independently on fast-check 4.11.0 and v5 by inlining assertions and selecting synchronous or asynchronous execution from result usage. Synchronous field access remains supported when the result is also awaited or passed elsewhere; conflicting or uncertain usages are reported.

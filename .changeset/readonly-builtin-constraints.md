---
'fast-check': patch
---

Declare constraint inputs as readonly across built-in arbitraries and their internal consumers. Accept mutable constraints, `Readonly` constraint objects, and `as const` configurations while preserving generated value types and inference.

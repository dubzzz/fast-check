---
'fast-check': patch
---

Performance: use Math.imul and bit shift in performance-critical paths. Improves float generation performance by ~7.5%.
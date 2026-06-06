---
"fast-check": patch
---

🐛 Fix `fc.stringMatching` duplicating literal runs around non-literal nodes

The recent generate-time optimization of `fc.stringMatching` accumulated
consecutive literal characters into a single pending run but failed to reset
that run after flushing it ahead of a non-literal node. As a result, any
pattern mixing literals with other nodes (e.g. `[a-z]+@[a-z]+\.[a-z]+`)
re-emitted the literal run a second time at the end of the alternative,
producing values that did not match the source regex.

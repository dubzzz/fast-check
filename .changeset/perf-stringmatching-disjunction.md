---
"fast-check": patch
---

⚡️ Faster `fc.stringMatching` on `generate` for alternations

Nested disjunctions (`a|b|c|d`) are flattened into a single `oneof` over all
alternatives instead of a depth-N tree of binary `oneof`s, which also keeps the
choice uniform across alternatives.

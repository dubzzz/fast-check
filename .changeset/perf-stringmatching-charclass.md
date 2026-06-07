---
"fast-check": patch
---

⚡️ Faster `fc.stringMatching` on `generate` for character classes

Non-negated character classes (e.g. `[a-zA-Z0-9]`) now compile to a single flat
`mapToConstant` over the union of their members instead of an `oneof` of
per-child arbitraries, and negated classes resolve to their enumerated
complement set when it can be computed.

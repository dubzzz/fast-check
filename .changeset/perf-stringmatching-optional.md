---
"fast-check": patch
---

⚡️ Faster `fc.stringMatching` on `generate` for the `?` quantifier

The optional quantifier now uses `option(node, { nil: '', freq: 2 })` instead of
building the full array machinery of `string({ minLength: 0, maxLength: 1 })`.
`freq: 2` keeps the empty/present split at ~1/2, matching the previous behavior.

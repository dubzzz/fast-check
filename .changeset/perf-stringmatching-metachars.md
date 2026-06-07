---
"fast-check": patch
---

⚡️ Faster `fc.stringMatching` on `generate` for `\W`, `\D`, `\S` and `.`

The negated meta-classes and `.` now draw from a precomputed allowed-character
set via `constantFrom` instead of rejection-sampling a single-character
`string()` and filtering it, removing both the array/map wrapper and the
rejected draws from the hot path.

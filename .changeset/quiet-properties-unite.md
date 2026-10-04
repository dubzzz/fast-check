---
"fast-check": major
"@fast-check/ava": patch
"@fast-check/jest": patch
"@fast-check/vitest": patch
"@fast-check/worker": patch
---

💥 Rename `asyncProperty` into `property`

Use `fc.property` for both synchronous and asynchronous predicates. Replace calls to `fc.asyncProperty` with `fc.property` and keep awaiting `fc.assert` and `fc.check`.

Update the integrations to use the renamed API.

---
"fast-check": patch
---

⚡️ Faster `fc.stringMatching` on `generate` across character classes, negated metas, alternations and quantifiers

Reworked several generate-time hot paths of `fc.stringMatching`:

- Negated meta-classes (`\W`, `\D`, `\S`) and `.` now draw from a precomputed
  allowed-character set via `constantFrom` instead of rejection-sampling a
  single-character `string()` (`\W+` is ~8x faster).
- Non-negated character classes (e.g. `[a-zA-Z0-9]`) compile to a single flat
  `mapToConstant` over the union of their members rather than an `oneof` of
  per-child arbitraries; negated classes resolve to the complement set when it
  can be enumerated.
- The `?` quantifier uses `oneof(constant(''), node)` instead of building the
  full array machinery of `string({ minLength: 0, maxLength: 1 })`.
- Alternatives concatenate their children with direct `+` / a tight loop
  instead of `join`.
- Nested disjunctions (`a|b|c|d`) are flattened into a single `oneof`, keeping
  the choice uniform across all alternatives.

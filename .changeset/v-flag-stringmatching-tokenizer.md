---
"fast-check": patch
---

✨ Accept the `v` flag on regexes passed to `stringMatching`

Tokenize ES2024 `v`-flag (unicodeSets) regex input in `stringMatching`. Regexes that only rely on syntax also legal under `u` (e.g. `/abc/v`, `/[a-z]/v`, `/\p{Letter}/v`) now produce values just like their `u`-flagged counterparts. `v`-only constructs (`\q{...}`, `&&`, `--`, nested character classes) are recognized by the tokenizer and materialized as dedicated AST nodes (`ClassStrings`, `ClassIntersection`, `ClassSubtraction`), but reaching them during generation still throws a targeted "not implemented yet" error — full generator support for these constructs will land in a follow-up.

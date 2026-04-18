---
"fast-check": minor
---

Accept the `v` (unicode sets) flag in `stringMatching`. Regexes such as `/abc/v` are now tokenized like their `u` counterparts. Regexes relying on unicode-sets-only grammar (set operations `&&`/`--`, nested character classes, `\q{…}`) are rejected with an actionable error for now.

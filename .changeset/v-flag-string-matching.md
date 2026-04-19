---
'fast-check': minor
---

✨ Accept the `v` flag (unicode-sets) on `stringMatching`

`stringMatching` now accepts regular expressions declared with the `v` flag in addition to `u`. The tokenizer treats `v` as unicode-mode, which is enough to support patterns whose syntax is shared with the `u` flag (eg. `/abc/v`, `/[a-z]+/v`, `/\p{Letter}+/v`). Patterns relying on `v`-specific syntax (set operators `&&`/`--`, nested character classes, `\q{...}`) are not yet supported and will fall through the tokenizer unchanged.

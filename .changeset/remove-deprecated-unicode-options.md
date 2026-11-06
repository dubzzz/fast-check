---
"fast-check": major
---

🔥 Remove the deprecated `noUnicodeString` and `withUnicodeString` options in favor of `stringUnit`.

For `json` and `jsonValue`, replace `{ noUnicodeString: false }` with `{ stringUnit: 'binary' }`.
For `anything` and `object`, replace `{ withUnicodeString: true }` with `{ stringUnit: 'binary' }`.

For the opposite boolean values, omit the deprecated option to keep the existing default, or explicitly use `{ stringUnit: 'grapheme-ascii' }`.
Existing `stringUnit` settings, including custom string-unit arbitraries, continue to work. Explicit `key` and `values` arbitraries still override the defaults for `anything` and `object`.

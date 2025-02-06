---
slug: /core-blocks/arbitraries/primitives/char/
---

# Char

Generate single-character values.

## char

One printable character — _ie.: one character between `0x20` (included) and `0x7e` (included), corresponding to printable characters (see https://www.ascii-code.com/)_.

**Signatures:**

- `fc.char()` — _deprecated since v3.22.0, prefer [string](https://fast-check.dev/docs/core-blocks/arbitraries/primitives/string/#string-1) ([#5233](https://github.com/dubzzz/fast-check/pull/5233))_

**Usages:**

```js
fc.char();
// Examples of generated values: "{", "x", "N", "8", "m"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/char.html).  
Available since 0.0.1.

---
slug: /core-blocks/arbitraries/primitives/char/
---

# Char

Generate single-character values.

## hexa

One lowercase hexadecimal character — ie.: _one character in `0123456789abcdef`_.

**Signatures:**

- `fc.hexa()` — _deprecated since v3.22.0 (more details at [#5233](https://github.com/dubzzz/fast-check/pull/5233))_

**Usages:**

```js
fc.hexa();
// Examples of generated values: "5", "f", "7", "d", "9"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/hexa.html).  
Available since 0.0.1.

## base64

One base64 character — _ie.: one character in `A-Z`, `a-z`, `0-9`, `+` or `/`_.

**Signatures:**

- `fc.base64()` — _deprecated since v3.22.0 (more details at [#5233](https://github.com/dubzzz/fast-check/pull/5233))_

**Usages:**

```js
fc.base64();
// Examples of generated values: "A", "H", "i", "l", "7"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/base64.html).  
Available since 0.0.1.

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

## unicode

One unicode character from BMP-plan — _ie.: one character between `0x0000` (included) and `0xffff` (included) but excluding surrogate pairs (between `0xd800` and `0xdfff`)_.

Generate any character of UCS-2 which is a subset of UTF-16 (restricted to BMP plan).

**Signatures:**

- `fc.unicode()` — _deprecated since v3.22.0, prefer [string](https://fast-check.dev/docs/core-blocks/arbitraries/primitives/string/#string-1) (more details at [#5233](https://github.com/dubzzz/fast-check/pull/5233))_

**Usages:**

```js
fc.unicode();
// Examples of generated values: "⬑", "￺", "叾", "꟣", "$"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/unicode.html).  
Available since 0.0.11.

## char16bits

One unicode character from BMP-plan (including part of surrogate pair) — _ie.: one character between `0x0000` (included) and `0xffff` (included)_.

Generate any 16 bits character. Be aware the values within `0xd800` and `0xdfff` which constitutes the surrogate pair characters are also generated meaning that some generated characters might appear invalid regarding UCS-2 and UTF-16 encoding.

**Signatures:**

- `fc.char16bits()` — _deprecated since v3.22.0 (more details at [#5233](https://github.com/dubzzz/fast-check/pull/5233))_

**Usages:**

```js
fc.char16bits();
// Examples of generated values: "", "毒", "丬", "縻", "贑"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/char16bits.html).  
Available since 0.0.11.

## fullUnicode

One unicode character — _ie.: one character between `0x0000` (included) and `0x10ffff` (included) but excluding surrogate pairs (between `0xd800` and `0xdfff`)_.

Its length can be greater than one as it potentially contains multiple UTF-16 characters for a single glyph (eg.: `"\u{1f434}".length === 2`).

**Signatures:**

- `fc.fullUnicode()` — _deprecated since v3.22.0, prefer [string](https://fast-check.dev/docs/core-blocks/arbitraries/primitives/string/#string-1) (more details at [#5233](https://github.com/dubzzz/fast-check/pull/5233))_

**Usages:**

```js
fc.fullUnicode();
// Examples of generated values: "􅍫", "#", "󳥰", "񸻩", "񘙠"…
```

Resources: [API reference](https://fast-check.dev/api-reference/functions/fullUnicode.html).  
Available since 0.0.11.

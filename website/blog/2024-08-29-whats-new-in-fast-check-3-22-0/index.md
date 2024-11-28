---
title: What's new in fast-check 3.22.0?
authors: [dubzzz]
tags: [what's new, arbitrary]
---

This release extends `string` capabilities to generate not only printable ASCII characters but also a wider range of values, finely definable by the user. It also includes several deprecations.

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## Polyglot `string`

Since its introduction in fast-check version 0.0.1, our arbitrary for strings has always been limited to generating strings made of printable characters from the ASCII range. It was only responsible for characters ranging between 0x20 (inclusive) and 0x7E (inclusive), with any other character being either outside of the ASCII range or non-printable. The image below shows the characters considered by the range with a white background, while others are shown with a red background.

![Printable ASCII characters](printable-ascii.png)

This release makes our string arbitrary polyglot. It can now generate strings made of not only printable ASCII characters but also a wide variety of other characters, including user-defined ones. This new capability is accessible via the `unit` constraint we added to the arbitrary.

```ts
fc.string({ unit: 'grapheme' });
```

Let's do a quick overview of its new capabilities.

### Grapheme

What a user refers to as a character is generally not a character in code terms. Users typically refer to a character as a visual entity displayed on their screen — _in this document, we use the term "grapheme" to refer to a "visual entity"_. The following table illustrates the distinction between user perception and the engineering perspective:

| Visual representation | JavaScript representation | Unicode representation         | Storage on disk (UTF-8)                                    |
| --------------------- | ------------------------- | ------------------------------ | ---------------------------------------------------------- |
| **a**                 | `'\u{0061}'`              | &lt;0061&gt;                   | &lt;61&gt;                                                 |
| **à**                 | `'\u{00E0}'`              | &lt;00E0&gt;                   | &lt;C3&gt;&nbsp;&lt;A0&gt;                                 |
| **𐞃**                 | `'\u{D801}\u{DF83}'`      | &lt;10783&gt;                  | &lt;F0&gt;&nbsp;&lt;90&gt;&nbsp;&lt;9E&gt;&nbsp;&lt;83&gt; |
| **à**                 | `'\u{0061}\u{0300}'`      | &lt;0061&gt;&nbsp;&lt;0300&gt; | &lt;61&gt;&nbsp;&lt;CC&gt;&nbsp;&lt;80&gt;                 |

From this, we can observe several things:

- A grapheme can be stored on multiple octets on disk.
- A grapheme can be composed of multiple JavaScript characters — _also referred to as code units_.
- A grapheme can consist of multiple Unicode code points.
- A grapheme can combine with others.

To capture all these variations, we introduced a built-in unit called `'grapheme'`. This unit generates any of the variations mentioned above. As with our original lexeme, the grapheme variation is limited to printable characters. When asked for a string of length N, it only produces strings with N independent graphemes. In other words, the produced string may have more than N characters and more than N code points.

For example, the following strings would all be considered as having a length of 1 for this unit:

```ts
'\u{0061}'; // it's a "a"
'\u{00E0}'; // it's the NFC version of "à"
'\u{0061}\u{0300}'; // it's the NFD version of "à"
```

But we could also have strings made of even more code units or code points that still adhere to the grapheme definition.

### Grapheme composite

However, dealing with graphemes is often not the default option for many algorithms, which typically operate at the code point level.

Therefore, we provide a variation of the above unit called `'grapheme-composite'`. This unit restricts itself to graphemes made of a single code point. In other words, the NFD version of the character `'à'` cannot be produced, but its NFC version can.

You can think of this variation as generating any printable code point that does not interact with the ones around it. When asked for a string of length N, this arbitrary will always generate a string made of N code points, but it may have more than N characters.

### Binary

Until now, we have always excluded non-printable characters from our string arbitrary. With this release, we provide users with a way to generate any character, including control characters, unassigned characters, and others, by using one of the two units: `'binary'` or `'binary-ascii'`.

### Custom

Finally, we made this arbitrary even more versatile as it can now generate strings made of user-definable characters. Users can now create their own unit as they did with `stringOf`.

For instance, if someone wants to generate strings made of only 0 and 1 and having at least one character, they can easily do it with the following line:

```ts
fc.string({ unit: fc.constantFrom('0', '1'), minLength: 1 });
```

## Deprecation notice

Due to the support for generating almost any kind of string directly from `string`, we decided to deprecate all its variations in favor of `string` with the appropriate value for `unit`.

As such `asciiString`, `unicodeString`, `fullUnicodeString`, `string16bits`, `hexaString` and `stringOf` have been officially deprecated. Their single-character variants — `ascii`, `unicode`, `fullUnicode`, `char16bits` and `hexa` — have also been deprecated in favor of `string` with the length set to 1. Other related arbitraries, such as `base64` and `char`, have also been deprecated.

We have also started deprecating a few variations around `BigInt`. We believe that the smaller the API surface, the easier it is for our users to find what they are looking for. Therefore, we now recommend using `bigInt` over any of its variations: `bigIntN`, `bigUint` or `bigUintN`.

Please note that these arbitraries will remain available in all versions 3.x of fast-check, although they will likely be removed in version 4.x.

## Changelog since 3.21.0

The version 3.22.0 is based on version 3.21.0.

### Features

- ([PR#5222](https://github.com/dubzzz/fast-check/pull/5222)) Support for grapheme on `fc.string`
- ([PR#5233](https://github.com/dubzzz/fast-check/pull/5233)) Mark as deprecated most of char and string arbitraries
- ([PR#5238](https://github.com/dubzzz/fast-check/pull/5238)) Deprecate `bigInt`'s alternatives

### Fixes

- ([PR#5237](https://github.com/dubzzz/fast-check/pull/5237)) CI: Drop TypeScript rc release channel
- ([PR#5241](https://github.com/dubzzz/fast-check/pull/5241)) CI: Move to changeset
- ([PR#5199](https://github.com/dubzzz/fast-check/pull/5199)) Doc: Publish release note for 3.21.0
- ([PR#5240](https://github.com/dubzzz/fast-check/pull/5240)) Doc: Better `string`'s deprecation note in documentation
- ([PR#5203](https://github.com/dubzzz/fast-check/pull/5203)) Refactor: Add missing types on exported

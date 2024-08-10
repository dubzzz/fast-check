---
title: What's new in fast-check 3.21.0?
authors: [dubzzz]
tags: [what's new, arbitrary]
---

This release introduces support for UUIDs version 6 to 15. It also extends `uuid` to allow specifying a single version or a set of versions.

Continue reading to explore the detailed updates it brings.

<!--truncate-->

## New `version` constraint for `uuid`

Until now, generating UUIDs for a given version has been the responsibility of the arbitrary `uuidV`. With version 3.21.0, we added support for custom versions directly within `uuid` and deprecated `uuidV`.

To switch from the deprecated `uuidV` to the new `uuid` syntax, you should make the following change:

```diff
--- fc.uuidV(4)
+++ fc.uuid({ version: 4 })
```

Starting with 3.21.0, `uuid` allows generating multiple versions. For instance, if users want to generate both UUID v4 and v7, they can use:

```js
fc.uuid({ version: [4, 7] });
```

## Changelog since 3.20.0

The version 3.21.0 is based on version 3.20.0.

### Features

- ([PR#5172](https://github.com/dubzzz/fast-check/pull/5172)) Support UUID versions [1-15] on `uuidV`
- ([PR#5189](https://github.com/dubzzz/fast-check/pull/5189)) Deprecate `uuidV` in favor of `uuid`
- ([PR#5188](https://github.com/dubzzz/fast-check/pull/5188)) Customize versions directly from `uuid`

### Fixes

- ([PR#5190](https://github.com/dubzzz/fast-check/pull/5190)) CI: Support npm publish on other tags
- ([PR#5124](https://github.com/dubzzz/fast-check/pull/5124)) Doc: Publish release note for 3.20.0
- ([PR#5137](https://github.com/dubzzz/fast-check/pull/5137)) Doc: Add missing options in the documentation for `float` and `double`
- ([PR#5142](https://github.com/dubzzz/fast-check/pull/5142)) Doc: Better width for stargazer badge in the documentation
- ([PR#5143](https://github.com/dubzzz/fast-check/pull/5143)) Doc: Document Faker integration
- ([PR#5144](https://github.com/dubzzz/fast-check/pull/5144)) Doc: Add support us page in our documentation

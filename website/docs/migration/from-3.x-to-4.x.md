---
sidebar_position: 1
slug: /migration-guide/from-3.x-to-4.x/
---

# From 3.x to 4.x

Simple migration guide to fast-check v4 starting from fast-check v3

## Changes in minimal requirements

| Name                    | New requirement | Previous requirement |
| ----------------------- | --------------- | -------------------- |
| TypeScript _(optional)_ | ≥5.0            | ≥4.1                 |

Related pull requests: [#5577](https://github.com/dubzzz/fast-check/pull/5577)

## Update to latest v3.x

Version 4 of fast-check introduces significant changes as part of its major release, including breaking changes. However, many of these changes can be addressed while still using the latest minor release of version 3.

To ensure a smoother migration to version 4, we recommend first upgrading to the latest minor release of version 3. Then, review and address the following deprecation notices to align your codebase with supported patterns.

### Changes on `date`

In version 4, the `date` arbitrary will generate any `Date` instances by default, including Invalid Date. If your code cannot handle invalid dates, you should add the `noInvalidDate: true` constraint to the configuration of your date builder to exclude such values.

```diff
-fc.date();
+fc.date({ noInvalidDate: true });
```

Related pull requests: [#5589](https://github.com/dubzzz/fast-check/pull/5589)

### Changes on `record`

In earlier versions, the `record` arbitrary included a flag named `withDeletedKeys`. Starting with version 2.11.0, this flag was deprecated and replaced by a new flag called `requiredKeys`. In version 4.0.0, the deprecated `withDeletedKeys` flag has been removed entirely.

To migrate, update your usage of the `record` arbitrary as follows:

```diff
fc.record(recordModel, {
-  withDeletedKeys: true,
+  requiredKeys: [],
});
fc.record(recordModel, {
-  withDeletedKeys: false,
});
```

Related pull requests: [#5578](https://github.com/dubzzz/fast-check/pull/5578)

## Advanced usages

### Custom reporters

The `error` field has been removed from the `RunDetails` object returned by `fc.check`. If you need access to the error message, use the `errorInstance` field instead, which was introduced in version 3.0.0.

Related pull requests: [#5584](https://github.com/dubzzz/fast-check/pull/5584)

### Property execution

If you have implemented a custom class that adheres to the `IRawProperty` API required by property runners, or if you have created a custom property runner (e.g., a custom implementation of `fc.assert` or `fc.check`), this change may affect your code.

The update requires property executors to explicitly call the `runBeforeEach` and `runAfterEach` hooks. This adjustment can already be made in version 3 by passing true as the second argument to the run method of properties.

Related pull requests: [#5581](https://github.com/dubzzz/fast-check/pull/5581)

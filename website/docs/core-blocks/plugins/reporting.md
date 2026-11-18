---
slug: /core-blocks/plugins/reporting/
---

# Reporting

Reporting plugins customize how property results are reported.

## `defaultReporter`

The `defaultReporter` plugin throws clear errors for failed runs.

```ts
{
  plugins: [
    defaultReporter(), // throw on failed runs
  ];
}
```

It distinguishes property failures, failures caused by too many skipped runs and plugin setup failures. It handles any run marked as `failed: true`.

By default, the original error is exposed as the `cause` of the reported error.
Pass `includeErrorInReport: true` to include it directly in the report message instead:

```ts
await fc.assert(
  fc.property(fc.nat(), (n) => n >= 0),
  { noDefaultPlugins: true, plugins: [fc.defaultReporter({ includeErrorInReport: true })] },
);
```

Pass `includeActualAndExpected: true` to also expose the original error's `actual` and `expected` properties on the reported error. This lets test runners display assertion diffs even when they only inspect the top-level error:

```ts
await fc.assert(
  fc.property(fc.nat(), (n) => {
    expect(n + 1).toBeGreaterThan(n);
  }),
  { noDefaultPlugins: true, plugins: [fc.defaultReporter({ includeActualAndExpected: true })] },
);
```

Both properties must be present on the original error to be copied, even if their values are `undefined`. The original error and its properties are left unchanged, and it remains available as `cause` unless `includeErrorInReport: true` is also set. The `includeActualAndExpected` option defaults to `false`.

:::note
This plugin is part of fast-check's default plugins. As such, `fc.assert` and other built-in runners enable it by default.
:::

Resources: [API reference](/docs/api/functions/defaultReporter).

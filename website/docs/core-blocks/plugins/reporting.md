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

It distinguishes property failures from failures caused by too many skipped runs.

By default, the original error is exposed as the `cause` of the reported error.
Pass `includeErrorInReport: true` to include it directly in the report message instead:

```ts
await fc.assert(
  fc.property(fc.nat(), (n) => n >= 0),
  { noDefaultPlugins: true, plugins: [fc.defaultReporter({ includeErrorInReport: true })] },
);
```

:::note
This plugin is part of fast-check's default plugins. As such, `fc.assert` and other built-in runners enable it by default.
:::

Resources: [API reference](/docs/api/functions/defaultReporter).

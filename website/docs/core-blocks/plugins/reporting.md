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

`fc.assert` and any other built-in runners enable this plugin by default as part of the default plugins.

Resources: [API reference](/docs/api/functions/defaultReporter).

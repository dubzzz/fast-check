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

`fc.assert` enables this plugin by default.

Resources: [API reference](/docs/api/functions/defaultReporter).

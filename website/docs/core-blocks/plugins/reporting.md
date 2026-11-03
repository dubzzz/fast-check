---
slug: /core-blocks/plugins/reporting/
---

# Reporting

Reporting plugins use the `onAllRunsComplete` hook to decide how to report the result of a property assessment.

## `defaultReporter`

The `defaultReporter` plugin reports failed runs with fast-check's standard error message. Successful runs are left unchanged. The report includes the seed, replay path, counterexample and number of shrinks for a failing property, or hints when too many values were skipped. It respects the `verbose` and `includeErrorInReport` options and supports asynchronous stringification of counterexamples.

`fc.assert` automatically appends this plugin after globally installed plugins and plugins passed in `plugins`. You do not need to add it for ordinary assertions.

When disabling the default plugins with `noDefaultPlugins: true`, you can explicitly restore default reporting:

```ts
await fc.assert(
  fc.property(fc.nat(), (n) => n >= 0),
  {
    noDefaultPlugins: true,
    plugins: [fc.defaultReporter()],
  },
);
```

You can also place `fc.defaultReporter()` among your other plugins to control reporting order. Completion hooks run in declaration order, and the first hook to throw determines the reported error. A custom reporting plugin placed before `defaultReporter()` can therefore override its error. If placed after it, the custom plugin still runs, but its error will not replace one already reported by `defaultReporter()`. Cleanup hooks (`afterAll`) still run after all completion hooks.

`fc.check` does not add default plugins. Explicitly passing `fc.defaultReporter()` to `check` enables reporting and can make it throw or reject on failed runs instead of returning the run details.

Resources: [API reference](/docs/api/functions/defaultReporter), [Custom reports](/docs/configuration/custom-reports/).

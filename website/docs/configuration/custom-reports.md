---
slug: /configuration/custom-reports/
---

# Custom reports

Customize how to report failures.

## Default Report

When failing `assert` automatically format the errors for you, with something like:

```txt
**FAIL**  sort.test.mjs > should sort numeric elements from the smallest to the largest one
Error: Property failed after 1 tests
{ seed: -1819918769, path: "0:...:3", endOnFailure: true }
Counterexample: [[2,1000000000]]
Shrunk 66 time(s)
Got error: AssertionError: expected 1000000000 to be less than or equal to 2
```

This behavior is provided by the built-in [`defaultReporter` plugin](/docs/core-blocks/plugins/reporting/#defaultreporter). `assert` adds it after your global and local plugins unless `noDefaultPlugins: true` is set. You can pass `fc.defaultReporter()` explicitly to restore default reporting or choose its position among your plugins.

While easily redeable, you may want to format it differently. Explaining how you can do that is the aim of this page.

:::info[How to read such reports?]
If you want to know more concerning how to read such reports, you may refer to the [Read Test Reports](/docs/tutorials/quick-start/read-test-reports/) section of our [Quick Start](/docs/tutorials/quick-start/basic-setup/) tutorial.
:::

## Verbosity

The simplest and built-in way to change how to format the errors in a different way is verbosity. Verbosity can be either 0, 1 or 2 and is defaulted to 1. It can be changed at `assert`'s level, by passing the option `verbose: <your-value>` to it.

You may refer to [Read Test Reports](/docs/tutorials/quick-start/read-test-reports/#how-to-increase-verbosity) for more details on it.

## New Reporter

In some cases you might be interested into fully customizing, extending or even changing how a failure should be formated. You can define your own reporting strategy by declaring a plugin relying on the `onAllRunsComplete` hook and passing it to `assert` as follow:

```javascript
const reporterPlugin = () => ({
  onAllRunsComplete: out => {
    if (out.failed) {
      // Throwing from `onAllRunsComplete` overrides the default report of `assert`
      throw new Error(`Property failed after ${out.numRuns} tests`, {
        cause: out.errorInstance,
      });
    }
  },
});

await fc.assert(
  fc.property(...),
  { plugins: [reporterPlugin] },
)
```

The default reporter throws for any run with `failed: true` and ignores all other outcomes. Your plugin runs before it: if your plugin throws or rejects, its error takes precedence over any error subsequently thrown by the default reporter. When multiple plugins report errors, the first error wins. Returning normally from your plugin leaves the default reporting in place.

:::info[Deprecated `reporter`]
Before the introduction of plugins, custom reporting used to be achieved by passing a custom `reporter` to `assert`:

```js
await fc.assert(fc.property(...), {
  async reporter(out) {
    if (out.failed) {
      throw new Error(`Property failed after ${out.numRuns} tests`, {
        cause: out.errorInstance,
      });
    }
  }
});
```

`reporter` is now deprecated: prefer a plugin relying on the `onAllRunsComplete` hook.
:::

### Disable the default report

Set `noDefaultPlugins: true` to drop the default report and eventually come with your own reporting.

You can handle the outcomes of an `assert` run directly via plugins in `onAllRunsComplete`: throw to report a failure, or return nothing when the outcome is acceptable. In this mode, `assert` does not reject because the property failed. Your reporters must throw for the outcomes you want to report as failures.

```js
await fc.assert(property, {
  noDefaultPlugins: true,
  plugins: [
    () => ({
      onAllRunsComplete(out) {
        if (out.failed) {
          throw new Error(`Property failed after ${out.numRuns} tests`, {
            cause: out.errorInstance,
          });
        }
      },
    }),
  ],
});
```

For asynchronous reporting, use an `async onAllRunsComplete` callback: let it resolve without a value when the outcome is acceptable, or throw to reject it. `assert` waits for all completion callbacks and cleanup before settling.

Other plugins can still report errors when `noDefaultPlugins` is enabled. In particular, plugins requesting interruptions usually handle their own reporting. See [run details](/docs/core-blocks/runners/#run-details) for the distinction between `failed`, `interrupted` and errors reported by plugins.

## CodeSandbox Reporter

In some situations, it can be useful to directly publish a minimal reproduction of an issue in order to be able to play with it. Reporter plugins can be used to provide such capabilities.

For instance, you can automatically generate CodeSandbox environments in case of failed property with the snippet below:

```js
import { getParameters } from 'codesandbox/lib/api/define';

const buildCodeSandboxReporterPlugin = (createFiles) => {
  return () => ({
    onAllRunsComplete(runDetails) {
      if (!runDetails.failed) {
        return;
      }
      const counterexample = runDetails.counterexample;
      const errorMessage = `Property failed after ${runDetails.numRuns} tests\nCounterexample: ${fc.stringify(counterexample)}`;
      if (counterexample === null) {
        throw new Error(errorMessage, { cause: runDetails.errorInstance });
      }
      const files = {
        ...createFiles(counterexample),
        'counterexample.js': {
          content: `export const counterexample = ${fc.stringify(counterexample)}`
        },
        'report.txt': {
          content: errorMessage
        }
      }
      const url = `https://codesandbox.io/api/v1/sandboxes/define?parameters=${getParameters({ files })}`;
      throw new Error(`${errorMessage}\n\nPlay with the failure here: ${url}`, {
        cause: runDetails.errorInstance,
      });
    },
  });
}

await fc.assert(
  fc.property(...),
  {
    plugins: [
      buildCodeSandboxReporterPlugin(counterexample => ({
        'index.js': {
          content: 'console.log("Code to reproduce the issue")'
        }
      }))
    ]
  }
)
```

:::info[CodeSandbox documentation]
The official documentation explaining how to build CodeSandbox environments from an url is available here: https://codesandbox.io/docs/importing#get-request.
:::

## Customize toString

By default, fast-check serializes generated values using its internal `stringify` helper. Sometimes you may want a better stringified representation of your instances. In such cases, you have several solutions:

1. If your instance defines a `toString` method, it will used to properly report it, unless you've defined one of the following methods, which take precedence.
2. If defining `toString` method is to intrusive, you can use `toStringMethod` and `asyncToStringMethod`.

In most cases, `toStringMethod` is sufficient. This is the serializer method that fast-check uses to serialize your instance in any context: synchronous or asynchronous.

```ts
Object.defineProperties(myInstanceWithoutCustomToString, {
  [fc.toStringMethod]: { value: () => 'my-value' },
});
// here your instance defines a custom serializer
// that will be used by fast-check whenever needed
```

However, if you're working with asynchronous values, you may need an async method to retrieve the value. For example:

```ts
Object.defineProperties(myPromisePossiblyResolved, {
  [fc.asyncToStringMethod]: {
    value: async () => {
      const resolved = await myPromisePossiblyResolved;
      return `My value: ${resolved}`;
    },
  },
});
```

:::info[Limitations of async variant]
Note that:

- `asyncToStringMethod` is only used in asynchronous contexts.
- Although `asyncToStringMethod` is marked as asynchronous, it should resolve almost instantly.

:::

:::tip[Test your custom `toString`]
One way to ensure that your instances will be properly stringified is to call the `stringify` function provided by fast-check. This will give you a preview of how your instances will be represented in the output.
:::

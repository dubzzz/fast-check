---
slug: /configuration/global-settings
---

# Global Settings

Share settings cross runners.

## Introduction

By default, the [runners](/docs/core-blocks/runners) take an [optional argument for extra settings](https://fast-check.dev/api-reference/interfaces/Parameters.html). Some of these settings can be re-used over-and-over in the same file and across several files.

Example:

```js
test('test #1', () => {
  fc.assert(myProp1, { numRuns: 10 });
});
test('test #2', () => {
  fc.assert(myProp2, { numRuns: 10 });
});
test('test #3', () => {
  fc.assert(myProp3, { numRuns: 10 });
});
```

## Share

The recommended way to share settings across runners is to use `configureGlobal`.

Here is how to update the snippet above to share the settings:

```js
fc.configureGlobal({ numRuns: 10 });

test('test #1', () => {
  fc.assert(myProp1);
});
test('test #2', () => {
  fc.assert(myProp2);
});
test('test #3', () => {
  fc.assert(myProp3);
});
```

:::warning
`configureGlobal` fully resets the settings. In other words, it fully drops the previously defined global settings if any even if they applied on other keys.
:::

:::tip Enrich existing global settings
If you want to only add new options on top of the existing ones you may want to use `readConfigureGlobal` as follow:

```js
fc.configureGlobal({ ...fc.readConfigureGlobal(), ...myNewOptions });
```

You can also fully reset all the global options by calling `resetConfigureGlobal`.
:::

Resources: [API reference](https://fast-check.dev/api-reference/functions/configureGlobal.html).  
Available since 1.18.0.

## Integration with test frameworks

Main test frameworks provide ways to connect `configureGlobal` on all the spec files without having to copy the snippet over-and-over. This section describes how to do so with some of them.

### Jest

You need to define a setup file (if not already done):

```js title="jest.config.js"
module.exports = {
  setupFiles: ['./jest.setup.js'],
};
```

Then you can add the global settings snippet directly into the setup file:

```js title="jest.setup.js"
const fc = require('fast-check');
fc.configureGlobal({ numRuns: 10 });
```

### Mocha

When calling mocha, you can provide an additional parameter to specify a file to be executed before the code of your tests by adding `--file=mocha.setup.js`.

Then you can add the global settings snippet directly into the setup file:

```js title="mocha.setup.js"
const fc = require('fast-check');
fc.configureGlobal({ numRuns: 10 });
```

### Vitest

You need to define a setup file (if not already done):

```ts title="vitest.config.js"
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // ...
    setupFiles: ['./vitest.setup.js'],
  },
});
```

Then you can add the global settings snippet directly into the setup file:

```js title="vitest.setup.js"
import fc from 'fast-check';
fc.configureGlobal({ numRuns: 10 });
```

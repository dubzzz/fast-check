---
sidebar_position: 1
---

# Tutorial Intro

Let's discover **fast-check in less than 5 minutes**.

## Getting Started

Get started by **creating a new node project**.

### What you'll need

- [Node.js](https://nodejs.org/en/download/) version 16.17.0 or above

## Setup the project

Create a new directory called `fast-check-tutorial` to start your new project and open a terminal within it.

Initialize the project and install fast-check as a dependency by running the following commands:

```bash npm2yarn
npm init --yes
npm install --save-dev fast-check
```

:::tip Usage with test runners

fast-check can be used in conjunction with any test runner. If you prefer using [Jest](https://jestjs.io/), [Vitest](https://vitest.dev/), [Ava](https://github.com/avajs/ava#readme) or any other, choice is yours! In this tutorial we will use the default test runner provided in Node since version 16.17.0.

:::

## Write an Hello World test file

Create your first test file with the following content:

```js title="test.mjs"
import { test } from 'node:test';

test('empty', () => {});
```

Edit your `package.json` as follow:

```json title="package.json"
{
  "private": "true",
  "name": "fast-check-tutorial",
  "version": "0.0.0",
  "devDependencies": {
    "fast-check": "*"
  },
  "scripts": {
    "test": "node test.mjs"
  }
}
```

We are now ready to start!

---
sidebar_position: 1
slug: /tutorials/quick-start/basic-setup
---

# Basic Setup

Setup your environment.

## Setup the project

In this tutorial, you'll need to have [Node.js](https://nodejs.org/en/download/) installed.

We will start from an already bootstrapped project to focus on our target: writing our first test.

:::info Setup
You may want to refer to our [Getting Started](/link-missing) section to setup fast-check in an existing project or without tutorial related code.
:::

```bash npm2yarn
npx degit dubzzz/fast-check/website/templates/fast-check-tutorial fast-check-tutorial
cd fast-check-tutorial
npm i
```

## Project structure

Our tutorial project is rather small, it contains the following files:

- `package.json` — the dependencies, scripts… used by the project
- `sort.mjs` — the code we want to test
- `sort.test.mjs` — our test file

This project is relying on [Vitest](https://vitest.dev/) to run the tests.

:::tip Test runners
Whether you prefer using [Jest](https://jestjs.io/), [Vitest](https://vitest.dev/), [Ava](https://github.com/avajs/ava#readme) or any other, choice is yours! fast-check is designed to be independent of the test runner you use, so you can choose the runner that works best for your project. More details on [Usage with other test runners](/link-missing).
:::

## Run the tests

You can run the tests written in the test file with:

```bash npm2yarn
npm test
```

We are now ready to start!

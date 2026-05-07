---
sidebar_position: 2
slug: /getting-started/
title: Getting started
description: Install @fast-check/vitest and write your first randomized Vitest test.
---

# Getting started

## Install

```bash npm2yarn
npm install --save-dev @fast-check/vitest
```

`@fast-check/vitest` requires [Vitest](https://vitest.dev/) to already be
installed in your project. See [Compatibility](./compatibility.md) for the
supported version ranges.

## Your first property-based test

```ts
import { test, fc } from '@fast-check/vitest';

test.prop([fc.string(), fc.string(), fc.string()])(
  'should detect the substring',
  (a, b, c) => {
    return (a + b + c).includes(b);
  },
);
```

Vitest runs the test, fast-check generates inputs, and if the property
ever fails you get a shrunk counter-example and a replayable seed in the
Vitest report.

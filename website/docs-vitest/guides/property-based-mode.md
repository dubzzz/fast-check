---
sidebar_position: 2
slug: /guides/property-based-mode/
title: Full property-based mode
description: Exhaustive, randomized testing with automatic shrinking via test.prop.
---

# Full property-based mode

For more extensive testing, `@fast-check/vitest` exposes `test.prop` and
`it.prop`. Each property runs many times with generated inputs and, on
failure, fast-check shrinks the counter-example before reporting it.

## Positional inputs

```ts
import { test, fc } from '@fast-check/vitest';

// for all strings a, b, c — b is a substring of a + b + c
test.prop([fc.string(), fc.string(), fc.string()])(
  'should detect the substring',
  (a, b, c) => {
    return (a + b + c).includes(b);
  },
);
```

## Named inputs

```ts
test.prop({ a: fc.string(), b: fc.string(), c: fc.string() })(
  'should detect the substring',
  ({ a, b, c }) => {
    return (a + b + c).includes(b);
  },
);
```

Predicates can be synchronous or asynchronous (any `PromiseLike` works).

## Modifiers: `.only`, `.skip`, `.todo`, `.concurrent`

`@fast-check/vitest` forwards Vitest's test modifiers onto `.prop`, and
complex chains like `.concurrent.skip` are supported:

```ts
import { describe, it, test, fc } from '@fast-check/vitest';

test.prop([fc.nat(), fc.nat()], { seed: 4242 })(
  'replays with seed 4242',
  (a, b) => a + b === b + a,
);

test.skip.prop([fc.string()])(
  'skipped',
  (text) => text.length === [...text].length,
);

describe('with it', () => {
  it.prop([fc.nat(), fc.nat()])(
    'should run too',
    (a, b) => a + b === b + a,
  );
});
```

## Forwarding fast-check parameters

`test.prop` accepts an optional `fc.Parameters` as its second argument —
see the main [Runners guide](/docs/core-blocks/runners/) for the full list of
options.

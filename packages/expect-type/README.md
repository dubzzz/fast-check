# `@fast-check/expect-type`

Make sure your types are the ones you expect (similar to `tsd`)

<a href="https://badge.fury.io/js/@fast-check%2Fexpect-type"><img src="https://badge.fury.io/js/@fast-check%2Fexpect-type.svg" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/@fast-check/poisoning"><img src="https://img.shields.io/npm/dm/@fast-check%2Fexpect-type" alt="monthly downloads" /></a>
<a href="https://github.com/dubzzz/fast-check/blob/main/packages/poisoning/LICENSE"><img src="https://img.shields.io/npm/l/@fast-check%2Fexpect-type.svg" alt="License" /></a>

---

## Easy to use

This package performs compilation time checks only. Running the check functions at runtime is a no-op.

```ts
import { expectType, expectTypeAssignable } from '@fast-check/expect-type';
// your code or you own imports

expectType<number>()(f(1, 2), 'expect the output of f when passed 1 and 2 to be number');
expectTypeAssignable<number>()(f(1, 2), 'expect the output of f when passed 1 and 2 to be assignable to number');
```

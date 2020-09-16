# Codemod - Explicit `minLength` and `maxLength`
_For constraints on array-like arbitraries_

---

Before version `2.4.0`, defining constraints on the size of an array required to use one of the following signatures:
- `fc.array(arb, maxLength)`
- `fc.array(arb, minLength, maxLength)`

Version 2.4.0 depreciated those signatures for another one `fc.array(arb, {minLength, maxLength})` which is more explicit.


The reasons behind this change are:
1. when seeing a call like `fc.array(arb, 10)` it was difficult to understand the meaning of the second argument: is is for the max? for the min?
2. no signature to only specify a min length, specifying a min required the user to also specify a max
3. difficult to use this kind of signature with `fc.set`, `fc.uint32array`... or even worst `fc.object`

This codemod converts implicit `minLength` and `maxLength` to the newly added object expression syntax.

---

**Minimal version:** `>=2.4.0`
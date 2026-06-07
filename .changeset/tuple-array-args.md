---
"fast-check": minor
---

✨ Allow `fc.tuple` to be called with an array of arbitraries

`fc.tuple` now accepts an array of arbitraries (`fc.tuple([a, b, c])`) in
addition to the existing spread form (`fc.tuple(a, b, c)`). Passing the array
directly avoids the cost of spreading it at the call site, making the
construction roughly twice as fast for internal helpers that build tuples from
arrays of arbitraries.

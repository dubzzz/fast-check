---
'fast-check': patch
---

For projects using Typescript 5.7+, `Arbitrary<TypedArray>`s are generic over `ArrayBuffer`. E.g. `Arbitrary<Uint8Array>` became `Arbitrary<Uint8Array<ArrayBuffer>>`.

---
slug: /core-blocks/arbitraries/composites/function
---

# Function

Generate functions.

## compareBooleanFunc

Generate a comparison function taking two parameters `a` and `b` and producing a boolean value.

`true` means that `a < b`, `false` that `a = b` or `a > b`

**Signatures:**

- `fc.compareBooleanFunc()`

**Usages:**

```js
fc.compareBooleanFunc();
// Examples of generated values:
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA < hB;
//     const hA = hash('-29' + stringify(a)) % 17;
//     const hB = hash('-29' + stringify(b)) % 17;
//     return cmp(hA, hB);
//   }
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA < hB;
//     const hA = hash('524475365' + stringify(a)) % 3037322393;
//     const hB = hash('524475365' + stringify(b)) % 3037322393;
//     return cmp(hA, hB);
//   }
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA < hB;
//     const hA = hash('-29' + stringify(a)) % 2516443298;
//     const hB = hash('-29' + stringify(b)) % 2516443298;
//     return cmp(hA, hB);
//   }
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA < hB;
//     const hA = hash('2126217969' + stringify(a)) % 3737752172;
//     const hB = hash('2126217969' + stringify(b)) % 3737752172;
//     return cmp(hA, hB);
//   }
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA < hB;
//     const hA = hash('-480068351' + stringify(a)) % 3671794935;
//     const hB = hash('-480068351' + stringify(b)) % 3671794935;
//     return cmp(hA, hB);
//   }
// • …
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/compareBooleanFunc.html).  
Available since 1.6.0.

## compareFunc

Generate a comparison function taking two parameters `a` and `b` and producing an integer value.

Output is zero when `a` and `b` are considered to be equivalent. Output is strictly inferior to zero means that `a` should be considered strictly inferior to `b` (similar for strictly superior to zero)

**Signatures:**

- `fc.compareFunc()`

**Usages:**

```js
fc.compareFunc();
// Examples of generated values:
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA - hB;
//     const hA = hash('-1057705109' + stringify(a)) % 2425734305;
//     const hB = hash('-1057705109' + stringify(b)) % 2425734305;
//     return cmp(hA, hB);
//   }
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA - hB;
//     const hA = hash('-13' + stringify(a)) % 20;
//     const hB = hash('-13' + stringify(b)) % 20;
//     return cmp(hA, hB);
//   }
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA - hB;
//     const hA = hash('2004846960' + stringify(a)) % 2464093828;
//     const hB = hash('2004846960' + stringify(b)) % 2464093828;
//     return cmp(hA, hB);
//   }
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA - hB;
//     const hA = hash('1384924905' + stringify(a)) % 2242944706;
//     const hB = hash('1384924905' + stringify(b)) % 2242944706;
//     return cmp(hA, hB);
//   }
// • function(a, b) {
//     // With hash and stringify coming from fast-check
//     const cmp = (hA, hB) => hA - hB;
//     const hA = hash('-741474720' + stringify(a)) % 555135046;
//     const hB = hash('-741474720' + stringify(b)) % 555135046;
//     return cmp(hA, hB);
//   }
// • …
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/compareFunc.html).  
Available since 1.6.0.

## func

Generate a function producing values using an underlying arbitrary.

**Signatures:**

- `fc.func(arb)`

**with:**

- `arb` — _arbitrary responsible to produce the values_

**Usages:**

```js
fc.func(fc.nat());
// Examples of generated values:
// • function(...args) {
//     // With hash and stringify coming from fast-check
//     const outs = [18];
//     return outs[hash('-2147483647' + stringify(args)) % outs.length];
//   }
// • function(...args) {
//     // With hash and stringify coming from fast-check
//     const outs = [1044253015,881466391,1911917064,3,2147483643,11,1097098198];
//     return outs[hash('-2147483643' + stringify(args)) % outs.length];
//   }
// • function(...args) {
//     // With hash and stringify coming from fast-check
//     const outs = [1644861079,2004697269];
//     return outs[hash('-31' + stringify(args)) % outs.length];
//   }
// • function(...args) {
//     // With hash and stringify coming from fast-check
//     const outs = [1192604909,672581076,1502245668,31791972,1761768821,396996837,676877520,1919262427,641285424];
//     return outs[hash('-493007294' + stringify(args)) % outs.length];
//   }
// • function(...args) {
//     // With hash and stringify coming from fast-check
//     const outs = [624842423,32338439,1321248893,980127887,850807339,1583851385,1093421004,1758229721,464930963];
//     return outs[hash('-2147483642' + stringify(args)) % outs.length];
//   }
// • …
```

Resources: [API reference](https://dubzzz.github.io/fast-check/api-reference/functions/func.html).  
Available since 1.6.0.

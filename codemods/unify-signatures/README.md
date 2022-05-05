# Codemod - Unify signatures across arbitraries

_A single way to customize arbitaries of fast-check_

---

Before RFC [#992](https://github.com/dubzzz/fast-check/issues/992), there was no real unity between arbitraries regarding howto apply constraints on them.

For arrays, we had signatures like:

- `fc.array(arb, maxLength)`
- `fc.array(arb, minLength, maxLength)`

While for objects but also web urls, signatures adding constraints onto the generated values were:

- `fc.object(constraints)`
- `fc.webUrl(constraints)`

The choice has been to favor contraints-based signatures because (more details on rfc):

1. when seeing a call like `fc.array(arb, 10)` it was difficult to understand the meaning of the second argument: is is for the max? for the min?
2. on `fc.array` for instance: no signature to only specify a min length, specifying a min required the user to also specify a max
3. difficult to use this kind of signatures and overloads with `fc.set`, `fc.uint32array`... or even worst `fc.object`

This codemod converts calls with implicit arguments to their equivalent constraints-based version.

---

Running the codemod on your code:

```sh
# JavaScript code
npx jscodeshift -t https://raw.githubusercontent.com/dubzzz/fast-check/main/codemods/unify-signatures/transform.cjs <path_to_code>
# TypeScript code
npx jscodeshift --parser=ts --extensions=ts -t https://raw.githubusercontent.com/dubzzz/fast-check/main/codemods/unify-signatures/transform.cjs <path_to_code>
```

You may need one of the following additional options:

- `--allowAmbiguity=true` - _enforce potentially invalid conversions, it may be used as a second step if first execution let some non-migrated calls like `fc.array(arb, myCustomMaxLength)`_
- `--debug=true` - _enable debug mode for the codemod_
- `--local=true` - _mostly when lauching the codemod against the codebase of fast-check, it considers that local imports are imports of fast-check_

---

**Minimal version:** `>=2.4.0`

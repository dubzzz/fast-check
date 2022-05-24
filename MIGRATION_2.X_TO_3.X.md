# Migration 2.x to 3.x

While version `3.x` of fast-check includes some breaking changes, some of them can already be applied starting at the latest versions of `2.x`.
In other words, you can switch to `3.x` style directly in `2.x` for some of the features.

How to read through this document:

- ✨ means _migration can be done within `2.x`_
- 💥 means _migration has to be done within `3.x`_
- 🔨 means _coming with a migration script doing part of the job_
- 👽️ means _mostly impacted very advanced users_

We highly recommend you to apply the ✨ within a `2.x` then plan for the 💥 in `3.x` to avoid having a potentially huge change to do but do it incrementally.

## Unify signatures accross arbitraries ✨🔨

In the past, some signatures used to be ambiguous[^1], some were not extensible[^2] and some did not follow the modern signature approach adopted by new arbitraries[^3]. [More details](https://github.com/dubzzz/fast-check/issues/992)

So signatures have been adapted to embrace our new approach:

- `array(arb, maxLength)` ➜ `array(arb, {maxLength})` — [#2927](https://github.com/dubzzz/fast-check/pull/2927)
- `array(arb, minLength, maxLength)` ➜ `array(arb, {minLength, maxLength})` — [#2927](https://github.com/dubzzz/fast-check/pull/2927)
- `asciiString(maxLength)` ➜ `asciiString({maxLength})` — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `asciiString(minLength, maxLength)` ➜ `asciiString({minLength, maxLength})` — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `base64String(maxLength)` ➜ `base64String({maxLength})` — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `base64String(minLength, maxLength)` ➜ `base64String({minLength, maxLength})` — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `fullUnicodeString(maxLength)` ➜ `fullUnicodeString({maxLength})` — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `fullUnicodeString(minLength, maxLength)` ➜ `fullUnicodeString({minLength, maxLength})` — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `hexaString(maxLength)` ➜ `hexaString({maxLength})` — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `hexaString(minLength, maxLength)` ➜ `hexaString({minLength, maxLength})` — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `string(maxLength)` ➜ `string({maxLength})` — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `string(minLength, maxLength)` ➜ `string({minLength, maxLength})` — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `string16bits(maxLength)` ➜ `string16bits({maxLength})` — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `string16bits(minLength, maxLength)` ➜ `string16bits({minLength, maxLength})` — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `stringOf(charArb, maxLength)` ➜ `stringOf(charArb, {maxLength})` — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `stringOf(charArb, minLength, maxLength)` ➜ `stringOf(charArb, {minLength, maxLength})` — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `unicodeString(maxLength)` ➜ `unicodeString({maxLength})` — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `unicodeString(minLength, maxLength)` ➜ `unicodeString({minLength, maxLength})` — [#2929](https://github.com/dubzzz/fast-check/pull/2929)
- `shuffledSubarray(originalArray, minLength, maxLength)` ➜ `shuffledSubarray(originalArray, {minLength, maxLength})` — [#2930](https://github.com/dubzzz/fast-check/pull/2930)
- `subarray(originalArray, minLength, maxLength)` ➜ `subarray(originalArray, {minLength, maxLength})` — [#2930](https://github.com/dubzzz/fast-check/pull/2930)
- `commands(commandArbs, maxCommands)` ➜ `commands(commandArbs, maxCommands)` — [#2931](https://github.com/dubzzz/fast-check/pull/2931)
- `option(arb, freq)` ➜ `option(arb, {freq})` — [#2932](https://github.com/dubzzz/fast-check/pull/2932)
- `json(maxDepth)` ➜ `json({maxDepth})` — [#2933](https://github.com/dubzzz/fast-check/pull/2933)
- `unicodeJson(maxDepth)` ➜ `unicodeJson({maxDepth})` — [#2933](https://github.com/dubzzz/fast-check/pull/2933)
- `lorem(maxWordsCount)` ➜ `lorem({maxWordsCount})` — [#2934](https://github.com/dubzzz/fast-check/pull/2934)
- `lorem(maxWordsCount, sentencesMode)` ➜ `lorem({maxWordsCount, mode})` — [#2934](https://github.com/dubzzz/fast-check/pull/2934)
- `double(max)` ➜ `double({max})` — [#2928](https://github.com/dubzzz/fast-check/pull/2928)
- `double(min, max)` ➜ `double({min, max})` — [#2928](https://github.com/dubzzz/fast-check/pull/2928)
- `float(max)` ➜ `float({max})` — [#2928](https://github.com/dubzzz/fast-check/pull/2928)
- `float(min, max)` ➜ `float({min, max})` — [#2928](https://github.com/dubzzz/fast-check/pull/2928)
- `integer(max)` ➜ `integer({max})` — [#2939](https://github.com/dubzzz/fast-check/pull/2939)
- `integer(min, max)` ➜ `integer({min, max})` — [#2939](https://github.com/dubzzz/fast-check/pull/2939)

As the migration is pretty automatable, a codemod is provided to do part of the changes linked to this part for you. More details at: https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures

[^1]: Like `integer(max)` or `array(arb, maxLength)` and even `array(arb, minLength, maxLength)`.
[^2]: For instance, we added `size` and `depthIdentifier` onto `array` doing it with yet another set of extra parameters would have been problematic.
[^3]: Initially, the rule has been: one extra argument for each new option like `array(arb, maxLength)`. But it used to be replaced by constraints-based signatures like `object(constraints)` for the most recent additions.

## Drop some arbitraries ✨

Some arbitraries were duplicated, others had ambiguous names... so they got dropped in v3. The change below can be applied without having to bump to v3.

Here are the arbitraries that got removed and the replacement they got:

- `jsonObject` ➜ `jsonValue` — [#2933](https://github.com/dubzzz/fast-check/pull/2933)
- `unicodeJsonObject` ➜ `unicodeJsonValue` — [#2933](https://github.com/dubzzz/fast-check/pull/2933)
- `set` ➜ `uniqueArray` — [#2938](https://github.com/dubzzz/fast-check/pull/2938)
- `dedup` ➜ `clone` — [#2938](https://github.com/dubzzz/fast-check/pull/2938)
- `clonedConstant` ➜ `constant` — [#2938](https://github.com/dubzzz/fast-check/pull/2938)
- `genericTuple` ➜ `tuple` — [#2940](https://github.com/dubzzz/fast-check/pull/2940)
- `frequency` ➜ `oneof` — [#2960](https://github.com/dubzzz/fast-check/pull/2960)

Be careful when doing the change from `set` to `uniqueArray` as the API changed a bit and the default comparison operator switched from `===` to `SameValue`. Most of the other changes should be straightforward with no major impact.

## New floating point arbitraries ✨

-> 2928

## No more support for TypeScript versions <4.1 ✨

Support for versions of TypeScript below 4.1 has been removed by [#2935](https://github.com/dubzzz/fast-check/pull/2935). No need to wait `fast-chech@3` to bump to `typescript@4.1` or later.

## Depth follow the size ✨

We now try to limit automatically the depth of the recursive structures generated — [#2949](https://github.com/dubzzz/fast-check/pull/2949).

It has one major impact if you use `oneof` in conjonction with `letrec`: the first arbitrary you specify in `oneof` must be a leaf. In other words:

```ts
const { tree } = fc.letrec((tie) => ({
  tree: fc.oneof(tie('leaf'), tie('node')), // Good!!!
  node: fc.record({ left: tie('tree'), right: tie('tree') }),
  leaf: fc.nat(),
}));

// And not:
// const { tree } = fc.letrec((tie) => ({
//   tree: fc.oneof(tie('node'), tie('leaf')), // BAD!!!
//   node: fc.record({ left: tie('tree'), right: tie('tree') }),
//   leaf: fc.nat(),
// }));
```

By _leaf_, we mean something that does not re-run a potentially infinite recursion but will stop for sure in a finite amount of bumps. In the example above `tie('leaf')` is a leaf as it links to `fc.nat()` which definitely does not re-run yet another recursion cycle. But it could have been a constant value or any other terminal case (see it as the terminal case of your recursion).

In order to unlock this feature and change in v2, you must define a `baseSize` globally. It can be done with:

```ts
fc.configureGlobal({ baseSize: 'small' });
// 'small' is the default value when not specified
// but needs to be for v2 if you want to force its usage on depths
```

For backward compatibility reasons, in order to unlock the "depth inferred by size" in v2, you need to explicitely define a `baseSize` value globally or to define a `depthFactor` (now `depthSize` in v3) at the level of your recursive arbitrary. In v3, not specifying it will be fully equivalent to specifying it with value `'small'`.

## No more defaulting of some constraints 💥

Some arbitraries used to come with hardcoded values for some of their constraints when they were not specified by the user. They tend to use values that differ from what we use for main arbitraries. In an attempt, to use as much as possible the same defaulting strategies throughout our arbitraries, we have dropped some of those defaulted constraints to make them fit with others.

Here is the list of the constraints that got impacted:

- `maxCount` will not longer be defaulted to `5` on `lorem`: it will now use the same defaulting logic as arrays do — [#2952](https://github.com/dubzzz/fast-check/pull/2952)
- `maxKeys` will not longer be defaulted to `5` on object-like arbitraries: it will now use the same defaulting logic as arrays do — [#2951](https://github.com/dubzzz/fast-check/pull/2951)
- `maxDepth` will not longer be defaulted to `2` on object-like arbitraries: it will now be defaulted to infinity to let the object goes as deep as possible with respect to size related constraints — [#2951](https://github.com/dubzzz/fast-check/pull/2951)

---

# Migration 1.x to 2.x

Migration from version `1.x` to `2.x` of fast-check should be pretty straightforward as no major breaking changes have been released.
Nonetheless as some of the changes may break existing code, a major bump has been required.

The following documentation describes what has to be updated and how in case you encounter some troubles during this migration.

Most of the time the migration will just require to run one of the following commands:

```bash
# For yarn users
yarn add fast-check@^2.0.0 --dev
# For npm users
npm install fast-check@2.0.0 --save-dev
```

## Replace `with_deleted_keys` in `fc.record` by `withDeletedKeys`

The kebab-case attribute `with_deleted_keys` has been removed. You should now use its camel-case version `withDeletedKeys`.

```diff
   fc.record(
     {
       first_name: fc.string(),
       last_name: fc.string(),
       age: fc.nat(),
     }, {
---    with_deleted_keys: true
+++    withDeletedKeys: true
     })
```

Associated Pull Requests: [#749](https://github.com/dubzzz/fast-check/pull/749)

## Update explicit typing for `fc.constantFrom`

In the previous major, `fc.constantFrom` was not typing tuples properly and refused to compile some calls.

As an example, the following was not compiling:

```ts
fc.constantFrom(false, null, undefined, 0);
```

It required the user to explicitely specify the type:

```ts
/// In version 1.x.x
fc.constantFrom<boolean | null | number>(false, null, 0);

/// In version 2.x.x
fc.constantFrom(false, null, 0);
// or with an explicit typing
fc.constantFrom<(boolean | null | number)[]>(false, null, 0);
```

If you explicitely typed some calls, `fc.constantFrom<T>` should be updated into `fc.constantFrom` - _without any generic_ - or `fc.constantFrom<T[]>`.

Associated Pull Requests: [#747](https://github.com/dubzzz/fast-check/pull/747)

## Replace type interface `ObjectConstraints.Settings` by `ObjectConstraints`

The typing for the constraints that can be applied to configure `fc.object` and `fc.anything` has been moved: `ObjectConstraints.Settings` is now `ObjectConstraints`.

All the static methods that were previously defined onto `ObjectConstraints` are now fully internal.

Associated Pull Requests: [#755](https://github.com/dubzzz/fast-check/pull/755)

## No more browser build

In the previous major, fast-check was building a specific bundle for browsers. This bundle was easily _fetch-able_ from CDNs like unpkg.

Example of bundled version of fast-check: https://unpkg.com/browse/fast-check@1.22.1/lib/bundle.js

In version 2.x.x, we removed the build for browser bundles. Some CDNs will not be able to serve fast-check properly due to this change.

### With a CDN

If the browsers you are targeting are compatible with esm-modules, you can import fast-check from pika as follow:

```html
<script type="module">
  import fc from 'https://cdn.skypack.dev/fast-check';
  // code...
</script>
```

### Locally build the bundled version

Alternatively, you can easily build the `lib/bundle.js` file that was provided by fast-check by running the following command-line - _here we assume that you declared fast-check as a dependency of your project in the `package.json`_.

```bash
npx -p browserify browserify node_modules/fast-check/lib/fast-check.js --s fastcheck > node_modules/fast-check/lib/bundle.js
```

You can also produce a minified version of the bundle by running:

```bash
npx -p browserify -p terser -c "browserify node_modules/fast-check/lib/fast-check.js --s fastcheck | terser -c -m > node_modules/fast-check/lib/bundle.js"
```

For support of older browsers, you may have a look to [babelify](https://github.com/babel/babelify).

Associated Pull Requests: [#756](https://github.com/dubzzz/fast-check/pull/756)

## No more support for ES versions <2017

Support for versions of ES standard below 2017 has been removed.

If you are still using - _and not transpiling towards your target_ - a version of Node or of the browser that does not support ES2017, you can either keep using fast-check 1.x.x or have a look into [babel](https://github.com/babel/babel) and related projects such as [babelify](https://github.com/babel/babelify).

Associated Pull Requests: [#748](https://github.com/dubzzz/fast-check/pull/748)

## No more support for TypeScript versions <3.2

Support for versions of TypeScript below 3.2 has been removed.

If you are still using a version of TypeScript <3.2, you should keep using the version 1.x.x of fast-check.

Associated Pull Requests: [#750](https://github.com/dubzzz/fast-check/pull/750)

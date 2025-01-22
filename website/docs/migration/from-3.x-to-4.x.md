---
sidebar_position: 1
slug: /migration-guide/from-3.x-to-4.x/
---

# From 3.x to 4.x

Simple migration guide to fast-check v4 starting from fast-check v3

## Changes in minimal requirements

| Name                     | New requirement | Previous requirement |
| ------------------------ | --------------- | -------------------- |
| Node                     | ≥10.5.0         | ≥8                   |
| ECMAScript specification | ES2020          | ES2017               |
| TypeScript _(optional)_  | ≥5.0            | ≥4.1                 |

Related pull requests: [#5577](https://github.com/dubzzz/fast-check/pull/5577), [#5605](https://github.com/dubzzz/fast-check/pull/5605), [#5617](https://github.com/dubzzz/fast-check/pull/5617), [#5634](https://github.com/dubzzz/fast-check/pull/5634)

## Update to latest v3.x

Version 4 of fast-check introduces significant changes as part of its major release, including breaking changes. However, many of these changes can be addressed while still using the latest minor release of version 3.

To ensure a smoother migration to version 4, we recommend first upgrading to the latest minor release of version 3. Then, review and address the following deprecation notices to align your codebase with supported patterns.

### Changes on `date`

In version 4, the `date` arbitrary will generate any `Date` instances by default, including Invalid Date. If your code cannot handle invalid dates, you should add the `noInvalidDate: true` constraint to the configuration of your date builder to exclude such values.

```diff
-fc.date();
+fc.date({ noInvalidDate: true });
```

Related pull requests: [#5589](https://github.com/dubzzz/fast-check/pull/5589)

### Changes on `dictionary`

In version 4, the default behavior of `dictionary` will be updated to generate objects that may have null prototypes by default. As a result, unless configured otherwise, `dictionary` can produce both instances inheriting from the usual `Object` prototype and instances with no prototype.

If your code requires all generated objects to inherit from the usual `Object` prototype, you can set the `noNullPrototype` constraint to `true` (used to be defaulted to `true` in version 3). This option was introduced in version 3.13.0 and can be applied as follows:

```ts
fc.dictionary(fc.string(), fc.string(), {
  noNullPrototype: true,
  // other contraints (if any)...
});
```

Related pull requests: [#5609](https://github.com/dubzzz/fast-check/pull/5609)

### Changes on `record`

In earlier versions, the `record` arbitrary included a flag named `withDeletedKeys`. Starting with version 2.11.0, this flag was deprecated and replaced by a new flag called `requiredKeys`. In version 4.0.0, the deprecated `withDeletedKeys` flag has been removed entirely.

To migrate, update your usage of the `record` arbitrary as follows:

```diff
fc.record(recordModel, {
-  withDeletedKeys: true,
+  requiredKeys: [],
});
fc.record(recordModel, {
-  withDeletedKeys: false,
});
```

Additionally, the default behavior of `record` has been updated in version 4 to generate objects that may have null prototypes by default. This means that, unless configured otherwise, `record` will produce instances inheriting from the usual `Object` prototype as well as instances with no prototype.

If your code requires all generated objects to have the usual `Object` prototype, you can configure the `noNullPrototype` constraint to `true`. It has been introduced in version 3.13.0 and can be set as follow:

```ts
fc.record(recordModel, {
  noNullPrototype: true,
  // other contraints (if any)...
});
```

Related pull requests: [#5578](https://github.com/dubzzz/fast-check/pull/5578), [#5597](https://github.com/dubzzz/fast-check/pull/5597)

### Changes on strings

In version 4, we have made significant changes to our string arbitraries to simplify and enhance their usage.

First, we have removed arbitraries that generated single-character strings. Since generating a single character is equivalent to creating a string with a length of one, these specialized arbitraries were unnecessary. This change helps reduce the API surface and better aligns with typical use cases, as most users require multi-character strings rather than single-character ones.

Second, we have consolidated our main string arbitraries into a single string arbitrary. Previously, separate arbitraries existed for different character sets, such as ASCII and Unicode. In version 4, these have been unified into a single arbitrary that can be configured using the `unit` constraint to generate specific character types.

To assist with the migration, here’s how to update your existing code to the new API:

```diff
--fc.ascii();
++fc.string({ unit: 'binary-ascii', minLength: 1, maxLength: 1 });

--fc.asciiString();
++fc.string({ unit: 'binary-ascii' });
```

Related pull requests: [#5636](https://github.com/dubzzz/fast-check/pull/5636)

### Replace any reference to `.noBias`

The `.noBias` method, previously available on every `Arbitrary`, was marked as deprecated in version 3.20.0. It has been replaced by a standalone arbitrary with the same functionality. You can prepare for compatibility with the next major version by updating your code as follows:

```diff
--myArbitrary.noBias();
++fc.noBias(myArbitrary);
```

Related pull requests: [#5610](https://github.com/dubzzz/fast-check/pull/5610)

### Replace any reference to `unicodeJson*`

The arbitraries `unicodeJson` and `unicodeJsonValue` have been replaced with `json` and `jsonValue`. Instead of maintaining separate versions for different character sets, the new approach consolidates them into a single arbitrary that accepts a custom charset via constraints.

To migrate, update your code as follows:

```diff
--fc.unicodeJson();
++fc.json({ stringUnit: 'binary' }); // or 'grapheme'

--fc.unicodeJsonValue();
++fc.jsonValue({ stringUnit: 'binary' }); // or 'grapheme'
```

This change provides greater flexibility by allowing customization of the character set directly through the constraint options.

Related pull requests: [#5613](https://github.com/dubzzz/fast-check/pull/5613)

### Replace any reference to `uuidV`

Introduced in version 3.21.0 for `uuid`, the `version` constraint is intended to replace `uuidV`. This change can already be applied in version 3 by making the following update:

```diff
--fc.uuidV(4);
++fc.uuid({ version: 4 });
```

Related pull requests: [#5611](https://github.com/dubzzz/fast-check/pull/5611)

## Update to v4.x

After applying the recommendations for migrating to the latest v3.x, transitioning to version 4 should be straightforward. However, there are still a few changes to review, either during the upgrade or as you use the updated library. These changes enhance functionality and ensure a more powerful tool by default.

### Better type inference

Some typings have been enhanced to ease the user experience:

```ts
// In version 3:
fc.constant('a'); // Produces an Arbitrary<string>
fc.constant<'a'>('a'); // Produces an Arbitrary<'a'>

// In version 4:
fc.constant('a'); // Produces an Arbitrary<'a'>
fc.constant<string>('a'); // Produces an Arbitrary<string>
```

```ts
// In version 3:
fc.constantFrom('a', 'b'); // Produces an Arbitrary<string>
fc.constantFrom<'a' | 'b'>('a', 'b'); // Produces an Arbitrary<'a' | 'b'>

// In version 4:
fc.constantFrom('a', 'b'); // Produces an Arbitrary<'a' | 'b'>
fc.constantFrom<string[]>('a', 'b'); // Produces an Arbitrary<string>
```

Related pull requests: [#5577](https://github.com/dubzzz/fast-check/pull/5577), [#5605](https://github.com/dubzzz/fast-check/pull/5605)

### Default error reporting

We adopted a new approach to report errors by leveraging "[Error Cause](https://github.com/tc39/proposal-error-cause/blob/main/README.md#error-cause)", which is already supported by many test runners. Previously, when your predicate threw an `Error`, fast-check created a new `Error` instance with a message that combined fast-check’s failure details with your original error message.

Now, it attaches your original error as a cause. This approach improves integration with test runners, which often parse error messages for stack trace cleanup and reporting.

If you prefer the previous behavior, you can disable this feature in version 4 by enabling the `includeErrorInReport` flag. You can also test this behavior in version 3 by toggling the `errorWithCause` flag (renamed to `includeErrorInReport` in version 4).

Related pull requests: [#5590](https://github.com/dubzzz/fast-check/pull/5590)

### Faster `scheduler`

Since version 1.20.0, fast-check has included a primitive designed to help detect race conditions. This feature unlocked many advanced use cases and elevated the library's capabilities.

However, the previous implementation was slower than intended and allowed intermediate tasks to be created and executed between two scheduled ones. This inconsistency could lead to scenarios where code passed tests but later failed when additional microtasks were introduced. To address this, we have reworked the scheduler in version 4 to be faster, more consistent, and safer.

Consider the following example, where a scheduler instance `s` is used:

```ts
// `s`: an instance of scheduler provided by fast-check
s.schedule(Promise.resolve(1)).then(async () => {
  await 'something already resolved';
  s.schedule(Promise.resolve(2));
});
await s.waitAll();
```

In version 3, all scheduled tasks, including `Promise.resolve(2)`, would have been executed by the end of `s.waitAll()`. In version 4, however, `Promise.resolve(2)` remains pending. This is because during the `waitAll` loop, the scheduler processes `Promise.resolve(1)` and continues execution until `await 'something already resolved'`. At that point, the scheduler resumes its waiting sequence, but `Promise.resolve(2)` has not yet been scheduled and remains unknown. As a result, `waitAll` finishes before executing it.

This behavior makes the scheduler more predictable and prevents subtle issues. In contrast, version 3 behaved inconsistently when processing many immediately resolved tasks, as shown below:

```ts
// `s`: an instance of scheduler provided by fast-check
s.schedule(Promise.resolve(1)).then(async () => {
  await 'something already resolved';
  await 'something already resolved';
  await 'something already resolved';
  await 'something already resolved';
  await 'something already resolved';
  s.schedule(Promise.resolve(2));
});
await s.waitAll();
```

On this second example version 3 would have behaved as version 4 with `Promise.resolve(2)` still pending. The only difference between the two examples being the number of `await` before the next scheduled tasks. This improvement ensures unexpected behaviors in such edge cases and ensures consistent behavior.

Related pull requests: [#5600](https://github.com/dubzzz/fast-check/pull/5600), [#5604](https://github.com/dubzzz/fast-check/pull/5604), [#5614](https://github.com/dubzzz/fast-check/pull/5614), [#5615](https://github.com/dubzzz/fast-check/pull/5615)

## Advanced usages

### Custom reporters

The `error` field has been removed from the `RunDetails` object returned by `fc.check`. If you need access to the error message, use the `errorInstance` field instead, which was introduced in version 3.0.0.

Related pull requests: [#5584](https://github.com/dubzzz/fast-check/pull/5584)

### Property execution

If you have implemented a custom class that adheres to the `IRawProperty` API required by property runners, or if you have created a custom property runner (e.g., a custom implementation of `fc.assert` or `fc.check`), this change may affect your code.

The update requires property executors to explicitly call the `runBeforeEach` and `runAfterEach` hooks. This adjustment can already be made in version 3 by passing true as the second argument to the run method of properties.

Related pull requests: [#5581](https://github.com/dubzzz/fast-check/pull/5581)

### Refined serializer

In previous major releases, the stringifier algorithm produced outputs like the following:

```ts
stringify(Object.create(null)); // 'Object.create(null)'
stringify(Object.assign(Object.create(null), { a: 1 })); // 'Object.assign(Object.create(null),{"a":1})'
```

Starting with the new major release, the output has been refined to:

```ts
stringify(Object.create(null)); // '{__proto__:null}'
stringify(Object.assign(Object.create(null), { a: 1 })); // '{__proto__:null,"a":1}'
```

This change is unlikely to impact most users. However, we are highlighting it for advanced users who might rely on custom reporting capabilities or stringifier behavior to meet specific needs.

Related pull requests: [#5603](https://github.com/dubzzz/fast-check/pull/5603)

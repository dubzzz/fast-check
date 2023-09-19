---
title: Detect prototype pollution automatically
authors: [dubzzz]
tags: [tips, cve, vulnerability]
---

Prototype pollution is among the most frequent sources of Common Vulnerabilities and Exposures - aka CVE - in the JavaScript ecosystem. As such detecting them early has always been one of the key challenges of fast-check.

In this post, you will learn what they are and how you can find them easily using fast-check.

<!--truncate-->

## Prototype pollution

The root of prototype pollution is that by default - or more precisely: except if precisely stated not to - any instance of object inherit from the Object class in JavaScript.

The following piece of code highlights it:

```ts
const instance = {};
instance.__proto__; // Object
'toString' in instance; // true
```

The idea of prototype pollution resides in the fact that most of the time we forget about the Object base-class and may expose our users.

Let's imagine an helper function called `merge` responsible to merge two instances together deeply. If not written with prototype pollution in mind it can be easy to fall into the vulnerable scenario below:

```js
// Vulnerable piece of code that may impact...
const maliciousPayload = '{"__proto__": {"isAdmin": true}}';
merge({}, JSON.parse(maliciousPayload));

// ...a totally unrelated piece of code anywhere else
const newUser = {};
newUser.isAdmin; // true
```

This vulnerability has been rated 6.5 and impacted any version of lodash strictly before 4.17.5. It got coined the [CVE-2018-3721](https://github.com/advisories/GHSA-fvqr-27wr-82fm).

## Automatic detection

Starting at [version 3.1.0](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/CHANGELOG.md#310), fast-check worked on making such vulnerabilities easier to detect without the need for extra guidance. Following this version, fast-check started to generate more frequently instances of objects coming with dangerous keys such as `__proto__` or `toString`. It was the first requirement but it only unlocked the ability to trigger the vulnerability, not to detect it.

So we launched a new helper package: [@fast-check/poisoning](https://www.npmjs.com/package/@fast-check/poisoning). This add-on is responsible to detect whenever a poisoning occured. When used in conjunction of fast-check it can be an ally to find prototype pollutions.

Let's take back the [CVE-2018-3721](https://github.com/advisories/GHSA-fvqr-27wr-82fm) and see how we could have found it with a test:

```ts
import fc from 'fast-check';
import { assertNoPoisoning, restoreGlobals } from '@fast-check/poisoning';
import _ from 'lodash';

test('CVE-2018-3721', () => {
  fc.assert(
    fc.property(fc.object(), fc.object(), (instance, other) => {
      _.merge(instance, other);
      assertNoPoisoning();
    }).afterEach(restoreGlobals)
  );
});
```

:::info Tips
Generally speaking, we encourage users not to alter directly the generated instances. By altering them in place you may make the shrinking and replay processes unpredictable.

We would rather recommend a more verbose property:

```diff
+++ const clone = _.cloneDeep(instance);
+++ _.merge(clone, other);
--- _.merge(instance, other);
assertNoPoisoning();
```

:::

By running this code against a vulnerable version of [lodash](https://lodash.com/) you get a working example proving the vulnerability.

:::warning Side notes

As triggering a prototype pollution might be tricky in some cases because library's authors attempted to protect against them, they might not popped immediately in the radar of this test.

While pretty efficient in many cases, property based tests can take more than a run to detect nasty issues. We recommend not only to launch them once but also to keep them with an unfixed seed in your CI. They are not supposed to be flaky but difficult to find bugs need time, energy and effort and you will probably prefer the bug to be reported in your CI than put of nowhere.

In order to increase your chances to detect the bug if any, you may want to increase the number of runs when you first run this test by playing with `numRuns`.
:::

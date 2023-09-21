---
title: Detect prototype pollution automatically
authors: [dubzzz]
tags: [tips, cve, vulnerability]
---

Prototype pollution is among the most frequent sources of Common Vulnerabilities and Exposures - aka CVE - in the JavaScript ecosystem. As a result, detecting them early has always been a key challenge for fast-check.

In this post, you will learn what they are and how you can find them easily using fast-check.

<!--truncate-->

## Prototype pollution

The root cause of prototype pollution is that, by default (or more precisely, unless explicitly stated otherwise), any instance of an object inherits from the Object class in JavaScript.

The following piece of code highlights it:

```ts
const instance = {};
instance.__proto__; // Object
'toString' in instance; // true
```

The concept of prototype pollution arises from the fact that we often overlook the Object base-class, potentially exposing our users.

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

Starting at [version 3.1.0](https://github.com/dubzzz/fast-check/blob/main/packages/fast-check/CHANGELOG.md#310), fast-check focused on making these vulnerabilities easier to detect without requiring additional guidance. From version 3.1.0 onwards, fast-check began generating instances of objects with potentially dangerous keys like `__proto__` or `toString` more frequently than it used to do before. It was the first requirement but it only unlocked the ability to trigger the vulnerability, not to detect it.

So we launched a new helper package: [@fast-check/poisoning](https://www.npmjs.com/package/@fast-check/poisoning). This add-on is responsible for detecting whenever a poisoning occurs. When used in conjunction of fast-check it can be an ally to find prototype pollutions.

Let's take back the [CVE-2018-3721](https://github.com/advisories/GHSA-fvqr-27wr-82fm) and see how we could have found it with a test:

```ts
import fc from 'fast-check';
import { assertNoPoisoning, restoreGlobals } from '@fast-check/poisoning';
import _ from 'lodash';

test('CVE-2018-3721', () => {
  fc.assert(
    fc
      .property(fc.object(), fc.object(), (instance, other) => {
        const clone = _.cloneDeep(instance); // no direct side-effects to instances coming out of fast-check
        _.merge(clone, other);
        assertNoPoisoning();
      })
      .afterEach(restoreGlobals),
  );
});
```

Running this code against a vulnerable version of [lodash](https://lodash.com/) provides a working example that demonstrates the vulnerability.

When I ran this test locally, I encountered an error. Specifically, with `instance = {}` and `other = {toString:{"":0}}`, a poisoning on the prototype of Object was detected. Here's the error output:

```txt
Error: Property failed after 9 tests
{ seed: 1874440714, path: "8:0:3:78:79:79:79:80:80:80", endOnFailure: true }
Counterexample: [{},{"toString":{"":0}}]
Shrunk 9 time(s)
Got error: Poisoning detected on Object.prototype.toString.
    at Object.assertNoPoisoning
    at /app/index.js
    at ...
```

## Flaky or not flaky?

A commonly shared concern regarding property based testing is: How stable will it be in my CI? Can I ensure it will be?

_How stable will it be in my CI?_

The philosophy being: play the test against 100 randomly generated values to find bugs, the deeper the error, the more likely it will not be detected everytime. That's said, property based testing already performs in a stable way even with only a hundred of executions.

_Can I ensure it will be?_

While a seed can be configured, we recommend not to give any: you will probably prefer the bug to be reported in your CI than coming from nowhere. Not providing any seed does not prevent replaying the test.

_Recommended_

In addition, as prototype pollution detection is most of all for vulnerability purposes, we recommend our users to tweak the `numRuns` when they first run the test on their side. It will increase their chance to find a bug if any. But then drop it for CI runs to keep the CI process smooth and quick.

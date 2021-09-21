# [:house:](../README.md) Hands on property based (JavaScript version)

Or go to the [TypeScript version](./HandsOnPropertyBased.md) of the Hands on.

## What is property based testing?

Property based testing has become quite famous in functional world. Mainly introduced by QuickCheck framework in Haskell, it suggests another way to test software. It targets all the scope covered by example based testing: from unit tests to integration tests.

It checks that a function, program or whatever system under test abides by a property. Property can be seen as a trait you expect to see in your output given the inputs. It does not have to be the expected result itself and most of the time it will not be.

A property is just something like:

> for all (x, y, ...)
>
> such that precondition(x, y, ...) holds
>
> predicate(x, y, ...) is true

For example, using properties you might state that:

> for any strings `a`, `b` and `c`
>
> `b` is a substring of `a + b + c`

Property based testing frameworks will take this spell as an input and run the check on multiple generated random entries. In case of failure, it should provide both a counterexample and the seed causing the generation.

They have the interesting property that the suggested counterexample is the minimal failing counterexample.

For instance: if whenever the string `a` contains `.` in it, the check above fails, then the counterexample would be `{a: '.', b: '', c: ''}` and not `{a: 'dfsdkf:!jk.fs', b: 'azda;', c: 'yyy§g'}`.

## Setting up a sample project

> Just wanting to see the result without installing any packages on your machine: try it online on our pre-configured [CodeSandbox](https://codesandbox.io/s/github/dubzzz/fast-check/tree/main/example?previewwindow=tests).

Initialize a new node project:

```bash
mkdir sample-fast-check
cd sample-fast-check
npm init --yes
```

Create a `src` folder and put the file `sort.js` into it:

```javascript
const sortInternal = (tab, start, end, cmp) => {
  if (end - start < 2) return tab;

  let pivot = start;
  for (let idx = start + 1; idx < end; ++idx) {
    if (!cmp(tab[start], tab[idx])) {
      let prev = tab[++pivot];
      tab[pivot] = tab[idx];
      tab[idx] = prev;
    }
  }
  let prev = tab[pivot];
  tab[pivot] = tab[start];
  tab[start] = prev;

  sortInternal(tab, start, pivot, cmp);
  sortInternal(tab, pivot + 1, end, cmp);
  return tab;
};

const sort = (tab) => {
  return sortInternal([...tab], 0, tab.length, (a, b) => a < b);
};

exports.sort = sort;
```

Install a test framework:

```bash
npm install --save-dev jest
mkdir specs ; touch specs/sort.spec.js
```

Edit `package.json` to configure the test framework:

```diff
    "scripts": {
---   "test": "echo \"Error: no test specified\" && exit 1"
+++   "test": "jest"
    },
```

## Hands on fast-check

Install fast-check:

```bash
npm install --save-dev fast-check
```

The algorithm under test is an integer sorting algorithm. Basically here are some of the properties we might come with:
- for any array of integers `data`: `data` and sort(`data`) should contain the same items (same number of each too)
- for any array of integers `data`: two consecutive items of sort(`data`) should be ordered

We can translate them with fast-check syntax:

```javascript
const fc = require('fast-check');
const { sort } = require('../src/sort');

test('should contain the same items', () => {
  const count = (tab, element) => tab.filter(v => v === element).length;
  fc.assert(
    fc.property(fc.array(fc.integer()), data => {
      const sorted = sort(data);
      expect(sorted.length).toEqual(data.length);
      for (const item of data) {
        expect(count(sorted, item)).toEqual(count(data, item));
      }
    })
  );
});

test('should produce ordered array', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), data => {
      const sorted = sort(data);
      for (let idx = 1; idx < sorted.length; ++idx) {
        expect(sorted[idx - 1]).toBeLessThanOrEqual(sorted[idx]);
      }
    })
  );
});
```

Copy and paste the code above into `specs/sort.spec.js` and run `npm run test`.

🎉 Congrats! 🎉 You have succesfully implemented your first test using fast-check.

---

If you want to experiment shrinking you might change the `sort` implementation as follow:

```diff
--- if (!cmp(tab[start], tab[idx])) {
+++ if (cmp(tab[start], tab[idx])) {
```

Framework should find a counterexample for the second property.

Then you can play with settings of `fc.assert` like:
- `{ verbose: true }`: show all the counterexamples encountered along the shrinking path
- `{ seed: <seed> }`: replay the exact same set of tests
- `{ seed: <seed>, path: <path> }`: start directly at the entry corresponding to the given `seed` and `path`
- `{ seed: <seed>, path: <path>, endOnFailure: true }`: start directly at the entry corresponding to the given `seed`, `path` and stop at the first failure without shrinking

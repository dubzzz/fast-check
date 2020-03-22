# [:house:](../README.md) Hands on property based

## What is property based testing?

Property based testing has become quite famous in functional world. Mainly introduced by QuickCheck framework in Haskell, it suggests another way to test software. It targets all the scope covered by example based testing: from unit tests to integration tests.

It checks that a function, program or whatever system under test abides by a property. Property can be seen as a trait you expect to see in your output given the inputs. It does not have to be the expected result itself and most of the time it will not be.

A property is just something like:

> for all (x, y, ...)
>
> such as precondition(x, y, ...) holds
>
> property(x, y, ...) is true

For example, using properties you might state that:

> for any strings `a`, `b` and `c`
>
> `b` is a substring of `a + b + c`

Property based testing frameworks will take this spell as an input and run the check on multiple generated random entries. In case of failure, it should provide both a counterexample and the seed causing the generation.

They have the interesting property that the suggested counterexample is the minimal failing counterexample.

For instance: if whenever the string `a` contains `.` in it, the check above fails, then the counterexample would be `{a: '.', b: '', c: ''}` and not `{a: 'dfsdkf:!jk.fs', b: 'azda;', c: 'yyy§g'}`.

## Setting up a sample project

> Just wanting to see the result without installing any packages on your machine: try it online on our pre-configured [CodeSandbox](https://codesandbox.io/s/github/dubzzz/fast-check/tree/master/example?previewwindow=tests).

Initialize a new node project:

```bash
mkdir sample-fast-check
cd sample-fast-check
npm init --yes
npm install typescript ts-node
echo "{}" > tsconfig.json
```

Create a `src` folder and put the file `sort.ts` into it:

```typescript
const sortInternal = <T>(tab: T[], start: number, end: number, cmp: (a: T, b: T) => boolean): T[] => {
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

export const sort = <T>(tab: T[]): T[] => {
  return sortInternal([...tab], 0, tab.length, (a, b) => a < b);
};
```

Install a test framework:

```bash
npm install --save-dev jest ts-jest @types/jest
mkdir specs ; touch specs/sort.spec.ts
```

Edit `package.json` to configure the test framework:

```json
// --
"scripts": {
  "test": "jest"
},
// --
"jest": {
  "moduleFileExtensions": ["ts", "tsx", "js"],
  "globals": {"ts-jest": {"tsConfig": "tsconfig.json"}},
  "transform": {"^.+\\.(ts|tsx)$": "ts-jest"},
  "testMatch": ["**/specs/*.+(ts|tsx|js)"]
},
// --
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

```typescript
import * as fc from 'fast-check';
import { sort } from '../src/sort';

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

Copy and paste the code above into `specs/sort.spec.ts` and run `npm run test`.

:tada: Congrats! :tada: You have succesfully implemented your first test using fast-check.

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

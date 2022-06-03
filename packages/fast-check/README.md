<h1>
  <img src="https://raw.githubusercontent.com/dubzzz/fast-check/main/logo/logo.png" alt="fast-check logo" />
</h1>

Property based testing framework for JavaScript/TypeScript

<a href="https://badge.fury.io/js/fast-check"><img src="https://badge.fury.io/js/fast-check.svg" alt="npm version" /></a>
<a href="https://www.npmjs.com/package/fast-check"><img src="https://img.shields.io/npm/dm/fast-check" alt="monthly downloads" /></a>
<a href="https://github.com/dubzzz/fast-check/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/fast-check.svg" alt="License" /></a>

---

## Easy to install:

```bash
npm install fast-check --save-dev
```

Or:

```bash
yarn add -D fast-check
```

## Easy to use:

```js
import fc from 'fast-check';
import { contains } from './my-contains.js'; // eg.: (text, pattern) => text.indexOf(pattern) >= 0;

describe('containts', () => {
  it('should always contain itself', () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        // string text always contains text
        expect(contains(text, text)).toBe(true);
      })
    );
  });

  it('should always contain its substrings', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
        // string a + b + c always contains b, whatever the values of a, b and c
        expect(contains(a + b + c, b)).toBe(true);
      })
    );
  });
});
```

Want to know more? Check out our official documentation on https://github.com/dubzzz/fast-check#readme

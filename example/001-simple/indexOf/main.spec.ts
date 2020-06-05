import fc from 'fast-check';
import { indexOf } from './src/indexOf';

describe('indexOf', () => {
  it('should confirm b is a substring of a + b + c', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
        return indexOf(a + b + c, b) !== -1;
      })
    );
  });

  it('should return the starting position of the pattern within text if any', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), fc.string(), (a, b, c) => {
        const text = a + b + c;
        const pattern = b;
        const index = indexOf(text, pattern);
        return index === -1 || text.substr(index, pattern.length) === pattern;
      })
    );
  });
});

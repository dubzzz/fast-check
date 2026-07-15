import { describe, it } from 'vitest';
import fc from 'fast-check';
import { indexOf } from './src/indexOf.js';

describe('indexOf', () => {
  it('should always find b within the concatenation a + b + c', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), fc.string(), fc.string(), (a, b, c) => {
        return indexOf(a + b + c, b) !== -1;
      }),
    );
  });

  it('should return an index where the pattern actually occurs', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), fc.string(), fc.string(), (a, b, c) => {
        const text = a + b + c;
        const pattern = b;
        const index = indexOf(text, pattern);
        return index === -1 || text.substr(index, pattern.length) === pattern;
      }),
    );
  });
});

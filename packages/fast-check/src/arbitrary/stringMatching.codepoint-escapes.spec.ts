import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { stringMatching } from './stringMatching.js';

describe('stringMatching with braced Unicode escapes', () => {
  it.each([/^\u{100000}$/u, /^\u{10ffff}$/u, /^\u{00000000000061}$/u, /^[\u{100000}-\u{10ffff}]$/u])(
    'should generate matching values for %s',
    (regex) => {
      const values = fc.sample(stringMatching(regex), { seed: 42, numRuns: 20 });

      expect(values.every((value) => regex.test(value))).toBe(true);
    },
  );
});

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { stringMatching } from './stringMatching.js';

describe('stringMatching with escaped surrogate pairs', () => {
  it.each([
    /^\uD83D\uDC31{2}$/u,
    /^[\uD83D\uDC31-\uD83D\uDC34]$/u,
    /^\uD800\uDC00{2}$/u,
    /^\uDBFF\uDFFF{2}$/u,
    /^\uD83D\uDC31{2}$/,
  ])('should generate matching values for %s', (regex) => {
    const values = fc.sample(stringMatching(regex), { seed: 42, numRuns: 20 });

    expect(values.every((value) => regex.test(value))).toBe(true);
  });
});

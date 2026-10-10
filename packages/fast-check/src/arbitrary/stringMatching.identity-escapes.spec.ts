import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { stringMatching } from './stringMatching.js';

describe('stringMatching with non-Unicode identity escapes', () => {
  it.each([
    '\\x',
    '\\xZ',
    '\\x1+',
    '\\x1Z',
    '\\u',
    '\\uZ',
    '\\u123+',
    '\\u123Z',
    '[\\xZ]',
    '[\\uZ]',
    '\\x{2}',
    '\\u{2}',
  ])('should generate matching values for %s', (source) => {
    const regex = new RegExp(`^${source}$`);
    const values = fc.sample(stringMatching(regex), { seed: 42, numRuns: 20 });

    expect(values.every((value) => regex.test(value))).toBe(true);
  });
});

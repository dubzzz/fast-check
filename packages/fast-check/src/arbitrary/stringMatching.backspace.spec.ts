import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { stringMatching } from './stringMatching.js';

describe.each(['', 'u'])('stringMatching with backspace and flags "%s"', (flags) => {
  it.each(['[\\b]', '[\\b-a]', '[\\b\\t]', '[^\\b]'])('should generate matching values for %s', (source) => {
    const regex = new RegExp(`^${source}$`, flags);
    const values = fc.sample(stringMatching(regex), { seed: 42, numRuns: 20 });

    expect(values.every((value) => regex.test(value))).toBe(true);
  });

  it.each(['\\bword\\b', '\\Bword\\B'])('should still reject unsupported boundary assertions in %s', (source) => {
    expect(() => stringMatching(new RegExp(source, flags))).toThrow();
  });
});

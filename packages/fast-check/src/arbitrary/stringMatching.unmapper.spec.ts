import { describe, it, expect } from 'vitest';
import { stringMatching } from './stringMatching.js';
import { check } from '../check/runner/Runner.js';
import { asyncProperty } from '../check/property/AsyncProperty.js';

describe('stringMatching without generation context', () => {
  it.each([
    { regex: /^a[0-9]+z$/, value: 'a123z' },
    { regex: /^(ab|a)b$/, value: 'ab' },
    { regex: /^a?b?$/, value: '' },
    { regex: /^a?b?$/, value: 'b' },
    { regex: /^(a[0-9]){2}$/, value: 'a1a2' },
    { regex: /^🐱[0-9]+$/u, value: '🐱123' },
    { regex: /a[0-9]+/, value: 'prefixa123suffix' },
  ])('should recognize $value for $regex', ({ regex, value }) => {
    const arb = stringMatching(regex);

    expect(arb.canShrinkWithoutContext(value)).toBe(true);
    for (const shrunk of arb.shrink(value, undefined)) {
      expect(regex.test(shrunk.value)).toBe(true);
    }
  });

  it.each(['a12', 'a12zx', 'aaz', 123, null])('should reject %s for an anchored concatenation', (value) => {
    expect(stringMatching(/^a[0-9]+z$/).canShrinkWithoutContext(value)).toBe(false);
  });

  it('should respect maxLength when recognizing examples', () => {
    const arb = stringMatching(/^a[0-9]+z$/, { maxLength: 4 });

    expect(arb.canShrinkWithoutContext('a12z')).toBe(true);
    expect(arb.canShrinkWithoutContext('a123z')).toBe(false);
  });

  it('should shrink a failing user-provided example', async () => {
    const details = await check(
      asyncProperty(stringMatching(/^a[0-9]+z$/), () => false),
      {
        examples: [['a123z']],
        numRuns: 1,
      },
    );

    expect(details.failed).toBe(true);
    expect(details.numShrinks).toBeGreaterThan(0);
    expect(details.counterexample).toEqual(['a0z']);
  });
});

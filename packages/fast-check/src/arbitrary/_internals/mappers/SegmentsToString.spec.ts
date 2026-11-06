import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { constantFrom } from '../../constantFrom.js';
import { fakeArbitrary } from '../../__test-helpers__/ArbitraryHelpers.js';
import { segmentsToStringUnmapperFor } from './SegmentsToString.js';

describe('segmentsToStringUnmapperFor', () => {
  it.each([
    { segments: [], value: '', expected: [] },
    { segments: [['']], value: '', expected: [''] },
    { segments: [[''], ['']], value: '', expected: ['', ''] },
    { segments: [['', 'a'], ['a']], value: 'a', expected: ['', 'a'] },
    { segments: [['a', 'ab'], ['c']], value: 'abc', expected: ['ab', 'c'] },
    {
      segments: [
        ['a', 'ab'],
        ['bc', 'c'],
      ],
      value: 'abc',
      expected: ['a', 'bc'],
    },
    { segments: [['🐱'], ['x']], value: '🐱x', expected: ['🐱', 'x'] },
  ])('should split $value into $expected', ({ segments, value, expected }) => {
    const unmapper = segmentsToStringUnmapperFor(segments.map((choices) => constantFrom(...choices)));

    expect(unmapper(value)).toEqual(expected);
  });

  it.each([undefined, null, 123, 'ab', 'abcx', 'bac'])('should reject incompatible value %s', (value) => {
    const unmapper = segmentsToStringUnmapperFor([constantFrom('a'), constantFrom('bc')]);

    expect(() => unmapper(value)).toThrow();
  });

  it('should reject a non-empty value for no segments', () => {
    expect(() => segmentsToStringUnmapperFor([])('a')).toThrow();
  });

  it('should recover valid parts of concatenated strings', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.array(fc.string({ maxLength: 8 }), { minLength: 1, maxLength: 4 }), { maxLength: 8 }),
        (segments) => {
          const value = segments.map((choices) => choices[0]).join('');
          const arbs = segments.map((choices) => constantFrom(...choices));
          const chunks = segmentsToStringUnmapperFor(arbs)(value);

          expect(chunks.join('')).toBe(value);
          expect(chunks).toHaveLength(arbs.length);
          expect(chunks.every((chunk, index) => arbs[index].canShrinkWithoutContext(chunk))).toBe(true);
        },
      ),
    );
  });

  it('should not repeatedly explore failed suffixes for ambiguous segments', () => {
    const { instance, canShrinkWithoutContext } = fakeArbitrary<string>();
    const source = 'a'.repeat(20) + 'b';
    const arbs = Array.from({ length: 24 }, () => instance);
    const maxChecks = arbs.length * (source.length + 1) ** 2;
    canShrinkWithoutContext.mockImplementation((value): value is string => {
      if (canShrinkWithoutContext.mock.calls.length > maxChecks) throw new Error('Repeated states');
      return value === '' || value === 'a' || value === 'aa';
    });

    expect(() => segmentsToStringUnmapperFor(arbs)(source)).toThrow('Unable to unmap received string');
    expect(canShrinkWithoutContext.mock.calls.length).toBeLessThanOrEqual(maxChecks);
  });

  it('should split many segments without recursive calls', () => {
    const arbs = Array.from({ length: 10000 }, () => constantFrom('a'));

    expect(segmentsToStringUnmapperFor(arbs)('a'.repeat(arbs.length))).toHaveLength(arbs.length);
  });
});

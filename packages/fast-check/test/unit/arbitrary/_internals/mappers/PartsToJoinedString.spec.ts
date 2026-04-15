import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  partsToJoinedStringMapper,
  partsToJoinedStringUnmapperFor,
} from '../../../../../src/arbitrary/_internals/mappers/PartsToJoinedString.js';
import { fakeArbitrary } from '../../__test-helpers__/ArbitraryHelpers.js';

const MaxLen = 0x7fffffff;

function buildUnmapper(acceptedChunksPerArb: string[][]) {
  const arbitraries = acceptedChunksPerArb.map((acceptedChunks) => {
    const acceptedSet = new Set(acceptedChunks);
    const { instance, canShrinkWithoutContext } = fakeArbitrary<string>();
    canShrinkWithoutContext.mockImplementation((value): value is string => acceptedSet.has(value as string));
    return instance;
  });
  const minLengths = acceptedChunksPerArb.map((chunks) => {
    let min = MaxLen;
    for (const c of chunks) if (c.length < min) min = c.length;
    return min;
  });
  const maxLengths = acceptedChunksPerArb.map((chunks) => {
    let max = 0;
    for (const c of chunks) if (c.length > max) max = c.length;
    return max;
  });
  return partsToJoinedStringUnmapperFor(arbitraries, minLengths, maxLengths);
}

describe('partsToJoinedStringMapper', () => {
  it('should join all parts into a single string', () => {
    expect(partsToJoinedStringMapper(['a', 'b', 'c'])).toBe('abc');
  });

  it('should return empty string for empty array', () => {
    expect(partsToJoinedStringMapper([])).toBe('');
  });

  it('should handle parts with multiple characters', () => {
    expect(partsToJoinedStringMapper(['hello', ' ', 'world'])).toBe('hello world');
  });
});

describe('partsToJoinedStringUnmapperFor', () => {
  it('should throw on non-string input', () => {
    const { instance } = fakeArbitrary<string>();
    const unmapper = partsToJoinedStringUnmapperFor([instance], [0], [MaxLen]);
    expect(() => unmapper(42)).toThrowError();
    expect(() => unmapper(null)).toThrowError();
    expect(() => unmapper(undefined)).toThrowError();
  });

  it('should unmap empty string with no arbitraries', () => {
    const unmapper = partsToJoinedStringUnmapperFor([], [], []);
    expect(unmapper('')).toEqual([]);
  });

  it('should throw when string is non-empty but no arbitraries', () => {
    const unmapper = partsToJoinedStringUnmapperFor([], [], []);
    expect(() => unmapper('abc')).toThrowError();
  });

  it.each`
    acceptedChunksPerArb                             | source           | expectedParts
    ${[['a'], ['b'], ['c']]}                         | ${'abc'}         | ${['a', 'b', 'c']}
    ${[['ab'], ['cd']]}                              | ${'abcd'}        | ${['ab', 'cd']}
    ${[['hello'], [' '], ['world']]}                 | ${'hello world'} | ${['hello', ' ', 'world']}
    ${[['a', 'ab'], ['b', 'c']]}                     | ${'abc'}         | ${['ab', 'c']}
    ${[['a'], ['', '1', '12', '123'], ['b']]}        | ${'a123b'}       | ${['a', '123', 'b']}
    ${[['a'], ['', '1', '12', '123'], ['b']]}        | ${'ab'}          | ${['a', '', 'b']}
    ${[[''], ['abc']]}                               | ${'abc'}         | ${['', 'abc']}
    ${[['', 'x'], ['', 'y']]}                        | ${''}            | ${['', '']}
  `(
    'should properly split $source into parts',
    ({ acceptedChunksPerArb, source, expectedParts }) => {
      // Act
      const unmapper = buildUnmapper(acceptedChunksPerArb);
      const parts = unmapper(source);

      // Assert
      expect(parts).toEqual(expectedParts);
    },
  );

  it.each`
    acceptedChunksPerArb             | source
    ${[['a'], ['b']]}                | ${'ac'}
    ${[['a'], ['b']]}                | ${'abc'}
    ${[['ab']]}                      | ${'a'}
    ${[['a'], ['b'], ['c']]}         | ${'ab'}
  `('should throw when string cannot be split into parts ($source)', ({ acceptedChunksPerArb, source }) => {
    // Act / Assert
    const unmapper = buildUnmapper(acceptedChunksPerArb);
    expect(() => unmapper(source)).toThrowError();
  });

  it('should be able to split strings built from known chunks back into parts', () =>
    fc.assert(
      fc.property(
        fc.array(fc.array(fc.string({ unit: 'binary', minLength: 1 }), { minLength: 1 }), { minLength: 1 }),
        fc.array(fc.nat()),
        (chunksPerArb, mods) => {
          // Arrange: pick one chunk per arbitrary using mods
          const picks = chunksPerArb.map((chunks, i) => {
            const mod = i < mods.length ? mods[i] : 0;
            return chunks[mod % chunks.length];
          });
          const source = picks.join('');
          const unmapper = buildUnmapper(chunksPerArb);

          // Act
          const parts = unmapper(source);

          // Assert
          expect(parts.join('')).toBe(source);
          expect(parts).toHaveLength(chunksPerArb.length);
        },
      ),
    ));
});

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { patternsToStringUnmapperFor } from '../../../../../src/arbitrary/_internals/mappers/PatternsToString';
import { fakeArbitrary } from '../../__test-helpers__/ArbitraryHelpers';

// prettier-ignore
const MorseCode = ['._', '_...', '_._.', '_..', '.', '.._.', '__.', '....', '..', '.___', '._..', '__', '_.', '___', '.__.', '__._', '._.', '...', '_', '.._', '..._', '.__', '_.._', '_.__', '__..'];

describe('patternsToStringUnmapperFor', () => {
  it.each`
    sourceChunks                      | source            | constraints                        | expectedChunks
    ${['a']}                          | ${'a'}            | ${{}}                              | ${['a']}
    ${['abc']}                        | ${'abc'}          | ${{}}                              | ${['abc']}
    ${['a']}                          | ${'aaa'}          | ${{}}                              | ${['a', 'a', 'a']}
    ${['a', 'b', 'c']}                | ${'abc'}          | ${{}}                              | ${['a', 'b', 'c']}
    ${['a', 'b', 'c', 'abc']}         | ${'abc'}          | ${{}}                              | ${['a', 'b', 'c'] /* starts by a: the shortest fit */}
    ${['ab', 'aaa', 'aba', 'a']}      | ${'abaaa'}        | ${{ minLength: 2, maxLength: 3 }}  | ${['ab', 'aaa'] /* starts by ab: the shortest fit */}
    ${['ab', 'aaa', 'aba', 'a']}      | ${'abaaa'}        | ${{ minLength: 3 }}                | ${['ab', 'a', 'a', 'a']}
    ${['a', 'aaaaa']}                 | ${'aaaaa'}        | ${{ maxLength: 1 }}                | ${['aaaaa']}
    ${['a', 'aaaaa']}                 | ${'aaaaa'}        | ${{ maxLength: 4 }}                | ${['aaaaa']}
    ${['a', 'aaaaa']}                 | ${'aaaaa'}        | ${{ maxLength: 5 }}                | ${['a', 'a', 'a', 'a', 'a'] /* starts by a: the shortest fit */}
    ${['a', 'aa']}                    | ${'aaaaaaaaaaa'}  | ${{ minLength: 0, maxLength: 10 }} | ${['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'aa']}
    ${['a', 'aa']}                    | ${'aaaaaaaaaaa'}  | ${{ minLength: 0 }}                | ${['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'] /* ignore maxGeneratedLength = maxLengthFromMinLength(minLength) = 2*minLength + 10 */}
    ${['a', 'aa']}                    | ${'aaaaaaaaaaaa'} | ${{ minLength: 0, maxLength: 10 }} | ${['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'aa', 'aa']}
    ${['a', 'aa']}                    | ${'aaaaaaaaaaaa'} | ${{ minLength: 0 }}                | ${['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a'] /* ignore maxGeneratedLength = maxLengthFromMinLength(minLength) = 2*minLength + 10 */}
    ${MorseCode}                      | ${'...___...'}    | ${{}}                              | ${['.', '.', '.', '_', '_', '_', '.', '.', '.']}
    ${MorseCode}                      | ${'...___...'}    | ${{ maxLength: 3 }}                | ${['..', '.__', '_...']}
    ${['\uD83D', '\uDC34', 'a', 'b']} | ${'a\u{1f434}b'}  | ${{}}                              | ${['a', '\uD83D', '\uDC34', 'b']}
  `(
    'should properly split $source into chunks ($constraints)',
    ({ sourceChunks, source, constraints, expectedChunks }) => {
      // Arrange
      const sourceChunksSet = new Set(sourceChunks);
      const { instance, canShrinkWithoutContext } = fakeArbitrary<string>();
      canShrinkWithoutContext.mockImplementation((value): value is string => sourceChunksSet.has(value as string));

      // Act
      const unmapper = patternsToStringUnmapperFor(instance, constraints);
      const chunks = unmapper(source);

      // Assert
      expect(chunks).toEqual(expectedChunks);
    },
  );

  it.each`
    sourceChunks       | source     | constraints
    ${['a', 'b', 'c']} | ${'abcd'}  | ${{}}
    ${['ab', 'aaa']}   | ${'abaaa'} | ${{ minLength: 3 }}
    ${['a']}           | ${'aaaaa'} | ${{ maxLength: 4 }}
  `('should throw when string cannot be split into chunks ($constraints)', ({ sourceChunks, source, constraints }) => {
    // Arrange
    const sourceChunksSet = new Set(sourceChunks);
    const { instance, canShrinkWithoutContext } = fakeArbitrary<string>();
    canShrinkWithoutContext.mockImplementation((value): value is string => sourceChunksSet.has(value as string));

    // Act / Assert
    const unmapper = patternsToStringUnmapperFor(instance, constraints);
    expect(() => unmapper(source)).toThrowError();
  });

  it('should be able to split strings built out of chunks into chunks', () =>
    fc.assert(
      fc.property(
        // Defining chunks, we allow "" to be part of the chunks as we do not request any minimal length for the 'split into chunks'
        fc.array(fc.string({ unit: 'binary' }), { minLength: 1 }),
        // Array of random natural numbers to help building the source string
        fc.array(fc.nat()),
        (sourceChunks, sourceMods) => {
          // Arrange
          const sourceChunksSet = new Set(sourceChunks);
          const { instance, canShrinkWithoutContext } = fakeArbitrary<string>();
          canShrinkWithoutContext.mockImplementation((value): value is string => sourceChunksSet.has(value as string));
          const source = sourceMods.map((mod) => sourceChunks[mod % sourceChunks.length]).join('');

          // Act
          const unmapper = patternsToStringUnmapperFor(instance, {});
          const chunks = unmapper(source);

          // Assert
          expect(chunks.join('')).toBe(source);
          // Remark: Found chunks may differ from the one we used to build the source
          // For instance:
          // >  sourceChunks = ["ToTo", "To"]
          // >  sourceMods   = [0]
          // >  chunks might be ["To", "To"] or ["ToTo"] and both are valid ones
        },
      ),
    ));

  it('should be able to split strings built out of chunks into chunks while respecting constraints in size', () =>
    fc.assert(
      fc.property(
        fc.array(fc.string({ unit: 'binary', minLength: 1 }), { minLength: 1 }),
        fc.array(fc.nat()),
        fc.nat(),
        fc.nat(),
        (sourceChunks, sourceMods, constraintsMinOffset, constraintsMaxOffset) => {
          // Arrange
          const sourceChunksSet = new Set(sourceChunks);
          const { instance, canShrinkWithoutContext } = fakeArbitrary<string>();
          canShrinkWithoutContext.mockImplementation((value): value is string => sourceChunksSet.has(value as string));
          const source = sourceMods.map((mod) => sourceChunks[mod % sourceChunks.length]).join('');
          const constraints = {
            minLength: Math.max(0, sourceMods.length - constraintsMinOffset),
            maxLength: sourceMods.length + constraintsMaxOffset,
          };

          // Act
          const unmapper = patternsToStringUnmapperFor(instance, constraints);
          const chunks = unmapper(source);

          // Assert
          expect(chunks.join('')).toBe(source);
          expect(chunks.length).toBeGreaterThanOrEqual(constraints.minLength);
          expect(chunks.length).toBeLessThanOrEqual(constraints.maxLength);
        },
      ),
    ));
});

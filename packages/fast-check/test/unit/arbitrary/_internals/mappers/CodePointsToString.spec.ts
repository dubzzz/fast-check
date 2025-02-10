import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  codePointsToStringMapper,
  codePointsToStringUnmapper,
} from '../../../../../src/arbitrary/_internals/mappers/CodePointsToString';

describe('codePointsToStringUnmapper', () => {
  it.each`
    source                                            | expected
    ${''}                                             | ${[]}
    ${'abc'}                                          | ${['a', 'b', 'c']}
    ${'\u{1f431}\u{00a0}\uD83D\uDC34a'}               | ${['\u{1f431}', '\u{00a0}', '\u{1f434}', 'a']}
    ${'\u{1f468}\u{1f3fe}\u{200d}\u{1f469}\u{1f3fc}'} | ${['\u{1f468}', '\u{1f3fe}', '\u{200d}', '\u{1f469}', '\u{1f3fc}']}
  `('should be able to split $source into code-points', ({ source, expected }) => {
    // Arrange / Act / Assert
    expect(codePointsToStringUnmapper(source)).toEqual(expected);
  });

  it('should be able to split any string mapped from code-points into code-points', () =>
    fc.assert(
      fc.property(fc.array(fc.string({ unit: 'binary', minLength: 1, maxLength: 1 })), (data) => {
        // Arrange
        const source = codePointsToStringMapper(data);

        // Act / Assert
        expect(codePointsToStringUnmapper(source)).toEqual(data);
      }),
    ));
});

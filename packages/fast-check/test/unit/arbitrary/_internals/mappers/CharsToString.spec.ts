import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  charsToStringMapper,
  charsToStringUnmapper,
} from '../../../../../src/arbitrary/_internals/mappers/CharsToString';

describe('charsToStringUnmapper', () => {
  it.each`
    source                              | expected
    ${''}                               | ${[]}
    ${'abc'}                            | ${['a', 'b', 'c']}
    ${'\u{1f431}\u{00a0}\uD83D\uDC34a'} | ${['\uD83D', '\uDC31', '\u00a0', '\uD83D', '\uDC34', 'a']}
    ${'\uD83D\uDC34\uDC34\uDC34\uD83D'} | ${['\uD83D', '\uDC34', '\uDC34', '\uDC34', '\uD83D']}
  `('should be able to split $source into chars', ({ source, expected }) => {
    // Arrange / Act / Assert
    expect(charsToStringUnmapper(source)).toEqual(expected);
  });

  it('should be able to split any string mapped from chars into chars', () =>
    fc.assert(
      fc.property(fc.array(fc.nat({ max: 0xffff }).map((n) => String.fromCharCode(n))), (data) => {
        // Arrange
        const source = charsToStringMapper(data);

        // Act / Assert
        expect(charsToStringUnmapper(source)).toEqual(data);
      }),
    ));
});

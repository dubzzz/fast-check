import * as fc from 'fast-check';
import { base64 } from '../../../src/arbitrary/base64';

import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';

import * as CharacterArbitraryBuilderMock from '../../../src/arbitrary/_internals/builders/CharacterArbitraryBuilder';
import { assertValidArbitrary } from './__test-helpers__/ArbitraryAssertions';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('base64', () => {
  it('should be able to unmap any mapped value', () => {
    // Arrange
    const { min, max, mapToCode, unmapFromCode } = extractArgumentsForBuildCharacter(base64);

    // Act / Assert
    fc.assert(
      fc.property(fc.integer({ min, max }), (n) => {
        expect(unmapFromCode(mapToCode(n))).toBe(n);
      }),
    );
  });

  it('should always unmap outside of the range for values it could not have generated', () => {
    // Arrange
    const { min, max, mapToCode, unmapFromCode } = extractArgumentsForBuildCharacter(base64);
    const allPossibleValues = new Set([...Array(max - min + 1)].map((_, i) => mapToCode(i + min)));

    // Act / Assert
    fc.assert(
      // [0, 1112063] is the range requested by fullUnicode
      fc.property(fc.oneof(fc.integer({ min: -1, max: 1112064 }), fc.maxSafeInteger()), (code) => {
        fc.pre(!allPossibleValues.has(code)); // not a possible code for our mapper
        const unmapped = unmapFromCode(code);
        expect(unmapped < min || unmapped > max).toBe(true);
      }),
    );
  });
});

describe('base64 (integration)', () => {
  const isCorrect = (value: string) =>
    value.length === 1 &&
    (('a' <= value && value <= 'z') ||
      ('A' <= value && value <= 'Z') ||
      ('0' <= value && value <= '9') ||
      value === '+' ||
      value === '/');

  const isStrictlySmaller = (c1: string, c2: string) => {
    const evaluate = (c: string) => {
      if ('A' <= c && c <= 'Z') return c.charCodeAt(0) - 'A'.charCodeAt(0);
      if ('a' <= c && c <= 'z') return c.charCodeAt(0) - 'a'.charCodeAt(0) + 26;
      if ('0' <= c && c <= '9') return c.charCodeAt(0) - '0'.charCodeAt(0) + 52;
      return c === '+' ? 62 : 63;
    };
    return evaluate(c1) < evaluate(c2);
  };

  const base64Builder = () => base64();

  it('should be a valid arbitrary', () => {
    assertValidArbitrary(base64Builder, {
      sameValueGivenSameSeed: {},
      correctValues: { isCorrect },
      shrinkableWithoutContext: {},
      sameValueWithoutInitialContext: {},
      strictlySmallerValue: { isStrictlySmaller },
    });
  });
});

// Helpers

function extractArgumentsForBuildCharacter(build: () => void) {
  const { instance } = fakeArbitrary();
  const buildCharacterArbitrary = jest.spyOn(CharacterArbitraryBuilderMock, 'buildCharacterArbitrary');
  buildCharacterArbitrary.mockImplementation(() => instance);

  build();
  const [min, max, mapToCode, unmapFromCode] = buildCharacterArbitrary.mock.calls[0];
  return { min, max, mapToCode, unmapFromCode };
}

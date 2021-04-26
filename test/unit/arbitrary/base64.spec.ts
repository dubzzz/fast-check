import * as fc from '../../../lib/fast-check';
import { base64 } from '../../../src/arbitrary/base64';

import { convertFromNext, convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { fakeNextArbitrary } from '../check/arbitrary/generic/NextArbitraryHelpers';

import * as CharacterArbitraryBuilderMock from '../../../src/arbitrary/_internals/builders/CharacterArbitraryBuilder';
import {
  assertGenerateProducesCorrectValues,
  assertGenerateProducesSameValueGivenSameSeed,
  assertGenerateProducesValuesFlaggedAsCanGenerate,
  assertShrinkProducesCorrectValues,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesStrictlySmallerValue,
  assertShrinkProducesValuesFlaggedAsCanGenerate,
} from '../check/arbitrary/generic/NextArbitraryAssertions';

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
      })
    );
  });

  it('should always unmap outside of the range for values it could not have generated', () => {
    // Arrange
    const { min, max, mapToCode, unmapFromCode } = extractArgumentsForBuildCharacter(base64);
    const allPossibleValues = new Set([...Array(max - min + 1)].map((_, i) => mapToCode(i + min)));

    // Act / Assert
    fc.assert(
      fc.property(fc.maxSafeInteger(), (code) => {
        fc.pre(!allPossibleValues.has(code)); // not a possible code for our mapper
        const unmapped = unmapFromCode(code);
        expect(unmapped < min || unmapped > max).toBe(true);
      })
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

  const base64Builder = () => convertToNext(base64());

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(base64Builder);
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(base64Builder, isCorrect);
  });

  it('should recognize values that would have been generated using it during generate', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(base64Builder);
  });

  it('should shrink towards the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(base64Builder);
  });

  it('should be able to shrink without any context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(base64Builder);
  });

  it('should only shrink towards correct values', () => {
    assertShrinkProducesCorrectValues(base64Builder, isCorrect);
  });

  it('should recognize values that would have been generated using it during shrink', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(base64Builder);
  });

  it('should preserve strictly smaller ordering in shrink', () => {
    assertShrinkProducesStrictlySmallerValue(base64Builder, isStrictlySmaller);
  });
});

// Helpers

function extractArgumentsForBuildCharacter(build: () => void) {
  const { instance } = fakeNextArbitrary();
  const buildCharacterArbitrary = jest.spyOn(CharacterArbitraryBuilderMock, 'buildCharacterArbitrary');
  buildCharacterArbitrary.mockImplementation(() => convertFromNext(instance));

  build();
  const [min, max, mapToCode, unmapFromCode] = buildCharacterArbitrary.mock.calls[0];
  return { min, max, mapToCode, unmapFromCode };
}

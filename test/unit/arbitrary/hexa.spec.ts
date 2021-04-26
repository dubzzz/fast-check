import * as fc from '../../../lib/fast-check';
import { hexa } from '../../../src/arbitrary/hexa';

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

describe('hexa', () => {
  it('should be able to unmap any mapped value', () => {
    // Arrange
    const { min, max, mapToCode, unmapFromCode } = extractArgumentsForBuildCharacter(hexa);

    // Act / Assert
    fc.assert(
      fc.property(fc.integer({ min, max }), (n) => {
        expect(unmapFromCode(mapToCode(n))).toBe(n);
      })
    );
  });

  it('should always unmap outside of the range for values it could not have generated', () => {
    // Arrange
    const { min, max, mapToCode, unmapFromCode } = extractArgumentsForBuildCharacter(hexa);
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

describe('hexa (integration)', () => {
  const isCorrect = (value: string) =>
    value.length === 1 && (('0' <= value && value <= '9') || ('a' <= value && value <= 'f'));

  const isStrictlySmaller = (c1: string, c2: string) => {
    const evaluate = (c: string) => ('0' <= c && c <= '9' ? c.charCodeAt(0) - 48 : c.charCodeAt(0) - 87);
    return evaluate(c1) < evaluate(c2);
  };

  const hexaBuilder = () => convertToNext(hexa());

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(hexaBuilder);
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(hexaBuilder, isCorrect);
  });

  it('should recognize values that would have been generated using it during generate', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(hexaBuilder);
  });

  it('should shrink towards the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(hexaBuilder);
  });

  it('should be able to shrink without any context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(hexaBuilder);
  });

  it('should only shrink towards correct values', () => {
    assertShrinkProducesCorrectValues(hexaBuilder, isCorrect);
  });

  it('should recognize values that would have been generated using it during shrink', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(hexaBuilder);
  });

  it('should preserve strictly smaller ordering in shrink', () => {
    assertShrinkProducesStrictlySmallerValue(hexaBuilder, isStrictlySmaller);
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

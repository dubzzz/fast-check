import * as fc from '../../../lib/fast-check';
import { ascii } from '../../../src/arbitrary/ascii';

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

describe('ascii', () => {
  it('should be able to unmap any mapped value', () => {
    // Arrange
    const { min, max, mapToCode, unmapFromCode } = extractArgumentsForBuildCharacter(ascii);

    // Act / Assert
    fc.assert(
      fc.property(fc.integer({ min, max }), (n) => {
        expect(unmapFromCode(mapToCode(n))).toBe(n);
      })
    );
  });

  it('should always unmap outside of the range for values it could not have generated', () => {
    // Arrange
    const { min, max, mapToCode, unmapFromCode } = extractArgumentsForBuildCharacter(ascii);
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

describe('ascii (integration)', () => {
  const isCorrect = (value: string) => value.length === 1 && 0x00 <= value.charCodeAt(0) && value.charCodeAt(0) <= 0x7f;

  const isStrictlySmaller = (c1: string, c2: string) => remapCharToIndex(c1) < remapCharToIndex(c2);

  const asciiBuilder = () => convertToNext(ascii());

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(asciiBuilder);
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(asciiBuilder, isCorrect);
  });

  it('should recognize values that would have been generated using it during generate', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(asciiBuilder);
  });

  it('should shrink towards the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(asciiBuilder);
  });

  it('should be able to shrink without any context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(asciiBuilder);
  });

  it('should only shrink towards correct values', () => {
    assertShrinkProducesCorrectValues(asciiBuilder, isCorrect);
  });

  it('should recognize values that would have been generated using it during shrink', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(asciiBuilder);
  });

  it('should preserve strictly smaller ordering in shrink', () => {
    assertShrinkProducesStrictlySmallerValue(asciiBuilder, isStrictlySmaller);
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

function remapCharToIndex(c: string): number {
  const cp = c.codePointAt(0)!;
  if (cp >= 0x20 && cp <= 0x7e) return cp - 0x20;
  if (cp < 0x20) return cp + 0x7e - 0x20;
  return cp;
}

import fc from '../../../lib/fast-check';
import { mapToConstant } from '../../../src/arbitrary/mapToConstant';
import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { NextValue } from '../../../src/check/arbitrary/definition/NextValue';
import {
  assertGenerateProducesCorrectValues,
  assertGenerateProducesSameValueGivenSameSeed,
  assertGenerateProducesValuesFlaggedAsCanGenerate,
  assertShrinkProducesCorrectValues,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesValuesFlaggedAsCanGenerate,
} from '../check/arbitrary/generic/NextArbitraryAssertions';
import { buildNextShrinkTree, renderTree } from '../check/arbitrary/generic/ShrinkTree';

describe('mapToConstant', () => {
  it('should reject any inputs containing at least one strictly negative entry', () =>
    fc.assert(
      fc.property(fc.array(fc.nat()), fc.array(fc.nat()), fc.integer({ max: -1 }), (beforeNeg, afterNeg, neg) => {
        // Arrange
        const entries = [...beforeNeg, neg, ...afterNeg].map((num) => ({ num, build: jest.fn() }));

        // Act / Assert
        expect(() => mapToConstant(...entries)).toThrowError();
      })
    ));

  it('should reject any inputs summing to zero', () =>
    fc.assert(
      fc.property(fc.nat({ max: 1000 }), (length) => {
        // Arrange
        const entries = [...Array(length)].map(() => ({ num: 0, build: jest.fn() }));

        // Act / Assert
        expect(() => mapToConstant(...entries)).toThrowError();
      })
    ));

  it('should accept any inputs not summing to zero and with positive or null values', () =>
    fc.assert(
      fc.property(fc.array(fc.nat(), { minLength: 1 }), (nums) => {
        // Arrange
        fc.pre(nums.some((n) => n > 0));
        const entries = nums.map((num) => ({ num, build: jest.fn() }));

        // Act / Assert
        expect(() => mapToConstant(...entries)).not.toThrowError();
      })
    ));
});

describe('mapToConstant (integration)', () => {
  type Extra = unknown[][];
  const extraParameters: fc.Arbitrary<Extra> = fc.array(fc.set(fc.anything(), { minLength: 1 }), { minLength: 1 });

  const isCorrect = (value: unknown, extra: Extra) => {
    for (const entryCandidate of extra) {
      if (entryCandidate.includes(value)) {
        // -0 and 0 are mixed by include
        return true;
      }
    }
    return false;
  };

  const mapToConstantBuilder = (extra: Extra) => {
    const alreadySeenConstants = new Set<unknown>();
    const entries: { num: number; build: (index: number) => unknown }[] = [];
    for (const entryCandidate of extra) {
      // Only keep values (aka constants) never seen before (-0 and 0) will be mixed due to Set
      const trimmedConstants = entryCandidate.filter((c) => !alreadySeenConstants.has(c));
      entries.push({ num: trimmedConstants.length, build: (index: number) => trimmedConstants[index] });
      trimmedConstants.forEach((c) => alreadySeenConstants.add(c));
    }
    return convertToNext(mapToConstant(...entries));
  };

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(mapToConstantBuilder, { extraParameters });
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(mapToConstantBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during generate', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(mapToConstantBuilder, { extraParameters });
  });

  it('should shrink towards the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(mapToConstantBuilder, { extraParameters });
  });

  it('should be able to shrink without any context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(mapToConstantBuilder, { extraParameters });
  });

  it('should only shrink towards correct values', () => {
    assertShrinkProducesCorrectValues(mapToConstantBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during shrink', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(mapToConstantBuilder, { extraParameters });
  });

  it('should be able to shrink c given hexa-like entries', () => {
    // Arrange
    const arb = convertToNext(
      mapToConstant(
        { num: 10, build: (index) => String.fromCodePoint(index + 48) }, // 0-9
        { num: 6, build: (index) => String.fromCodePoint(index + 97) } // a-f
      )
    );
    const value = new NextValue('c');

    // Act
    const renderedTree = renderTree(buildNextShrinkTree(arb, value)).join('\n');

    // Assert
    expect(renderedTree).toMatchSnapshot();
  });
});

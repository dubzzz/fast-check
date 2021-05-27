import { ipV4 } from '../../../src/arbitrary/ipV4';

import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { NextValue } from '../../../src/check/arbitrary/definition/NextValue';
import {
  assertGenerateProducesSameValueGivenSameSeed,
  assertGenerateProducesCorrectValues,
  assertGenerateProducesValuesFlaggedAsCanGenerate,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesCorrectValues,
  assertShrinkProducesValuesFlaggedAsCanGenerate,
} from '../check/arbitrary/generic/NextArbitraryAssertions';
import { buildNextShrinkTree, renderTree } from '../check/arbitrary/generic/ShrinkTree';

describe('ipV4 (integration)', () => {
  const isCorrect = (value: string) => {
    expect(value).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    for (const item of value.split('.')) {
      expect(Number(item)).not.toBeNaN();
      expect(Number(item)).toBeGreaterThanOrEqual(0);
      expect(Number(item)).toBeLessThanOrEqual(255);
    }
  };

  const ipV4Builder = () => convertToNext(ipV4());

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(ipV4Builder);
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(ipV4Builder, isCorrect);
  });

  it('should recognize values that would have been generated using it during generate', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(ipV4Builder);
  });

  it('should shrink towards the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(ipV4Builder);
  });

  it('should be able to shrink without any context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(ipV4Builder);
  });

  it('should only shrink towards correct values', () => {
    assertShrinkProducesCorrectValues(ipV4Builder, isCorrect);
  });

  it('should recognize values that would have been generated using it during shrink', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(ipV4Builder);
  });

  it.each`
    source
    ${'0.0.0.0'}
    ${'255.255.255.255'}
  `('should be able to generate $source with fc.ipV4()', ({ source }) => {
    // Arrange / Act
    const arb = convertToNext(ipV4());
    const out = arb.canShrinkWithoutContext(source);

    // Assert
    expect(out).toBe(true);
  });

  it.each`
    source
    ${'256.0.0.0'}
    ${'00.0.0.0'}
    ${'0xff.0.0.0'}
    ${'-1.0.0.0'}
  `('should not be able to generate $source with fc.ipV4()', ({ source }) => {
    // Arrange / Act
    const arb = convertToNext(ipV4());
    const out = arb.canShrinkWithoutContext(source);

    // Assert
    expect(out).toBe(false);
  });

  it.each`
    rawValue
    ${'128.0.0.1'}
    ${'8.8.4.4'}
  `('should be able to shrink $rawValue', ({ rawValue }) => {
    // Arrange
    const arb = convertToNext(ipV4());
    const value = new NextValue(rawValue);

    // Act
    const renderedTree = renderTree(buildNextShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(renderedTree).toMatchSnapshot();
  });
});

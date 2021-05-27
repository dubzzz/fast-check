import { ipV4Extended } from '../../../src/arbitrary/ipV4Extended';

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

describe('ipV4Extended (integration)', () => {
  const isCorrect = (value: string) => {
    const chunks = value.split('.').map((v) => {
      if (v[0] === '0') {
        if (v[1] === 'x' || v[1] === 'X') return parseInt(v, 16);
        return parseInt(v, 8);
      }
      return parseInt(v, 10);
    });

    // one invalid chunk
    if (chunks.find((v) => Number.isNaN(v)) !== undefined) return false;

    // maximal amount of 4 chunks
    if (chunks.length > 4) return false;

    // all chunks, except the last one are inferior or equal to 255
    if (chunks.slice(0, -1).find((v) => v < 0 && v > 255) !== undefined) return false;

    // last chunk must be below 256^(5 − number of chunks)
    return chunks[chunks.length - 1] < 256 ** (5 - chunks.length);
  };

  const ipV4ExtendedBuilder = () => convertToNext(ipV4Extended());

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(ipV4ExtendedBuilder);
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(ipV4ExtendedBuilder, isCorrect);
  });

  it('should recognize values that would have been generated using it during generate', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(ipV4ExtendedBuilder);
  });

  it('should shrink towards the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(ipV4ExtendedBuilder);
  });

  it('should be able to shrink without any context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(ipV4ExtendedBuilder);
  });

  it('should only shrink towards correct values', () => {
    assertShrinkProducesCorrectValues(ipV4ExtendedBuilder, isCorrect);
  });

  it('should recognize values that would have been generated using it during shrink', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(ipV4ExtendedBuilder);
  });

  it.each`
    source
    ${'0.0.0.0'}
    ${'255.255.255.255'}
    ${'00.0.0.0'}
    ${'0377.0.0.0'}
    ${'0xff.0.0.0'}
  `('should be able to generate $source with fc.ipV4Extended()', ({ source }) => {
    // Arrange / Act
    const arb = convertToNext(ipV4Extended());
    const out = arb.canShrinkWithoutContext(source);

    // Assert
    expect(out).toBe(true);
  });

  it.each`
    source
    ${'256.0.0.0'}
    ${'0378.0.0.0'}
    ${'0400.0.0.0'}
    ${'0x100.0.0.0'}
    ${'000.0.0.0'}
    ${'0x00.0.0.0'}
    ${'-1.0.0.0'}
  `('should not be able to generate $source with fc.ipV4Extended()', ({ source }) => {
    // Arrange / Act
    const arb = convertToNext(ipV4Extended());
    const out = arb.canShrinkWithoutContext(source);

    // Assert
    expect(out).toBe(false);
  });

  it.each`
    rawValue
    ${'128.0.0.1'}
    ${'010.0x8.4.04'}
  `('should be able to shrink $rawValue', ({ rawValue }) => {
    // Arrange
    const arb = convertToNext(ipV4Extended());
    const value = new NextValue(rawValue);

    // Act
    const renderedTree = renderTree(buildNextShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(renderedTree).toMatchSnapshot();
  });
});

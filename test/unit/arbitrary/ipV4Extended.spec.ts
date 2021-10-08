import { ipV4Extended } from '../../../src/arbitrary/ipV4Extended';

import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { NextValue } from '../../../src/check/arbitrary/definition/NextValue';
import {
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from './__test-helpers__/NextArbitraryAssertions';
import { buildNextShrinkTree, renderTree } from './__test-helpers__/ShrinkTree';

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

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(ipV4ExtendedBuilder);
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(ipV4ExtendedBuilder, isCorrect);
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(ipV4ExtendedBuilder);
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(ipV4ExtendedBuilder);
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
    const value = new NextValue(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildNextShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});

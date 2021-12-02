import { ipV6 } from '../../../src/arbitrary/ipV6';

import { Value } from '../../../src/check/arbitrary/definition/Value';
import {
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
} from './__test-helpers__/ArbitraryAssertions';
import { buildShrinkTree, renderTree } from './__test-helpers__/ShrinkTree';

describe('ipV6 (integration)', () => {
  const isValidIpV4 = (value: string) => {
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
  const isCorrect = (value: string) => {
    const firstElision = value.indexOf('::');
    if (firstElision !== -1) {
      // At most one '::'
      if (value.substr(firstElision + 1).includes('::')) return false;
    }
    const chunks = value.split(':');
    const last = chunks[chunks.length - 1];
    // The ipv4 can only be composed of 4 decimal chunks separated by dots
    // 1.1000 is not a valid IP v4 in the context of IP v6
    const endByIpV4 = last.includes('.') && isValidIpV4(last);

    const nonEmptyChunks = chunks.filter((c) => c !== '');
    const hexaChunks = endByIpV4 ? nonEmptyChunks.slice(0, nonEmptyChunks.length - 1) : nonEmptyChunks;
    if (!hexaChunks.every((s) => /^[0-9a-f]{1,4}$/.test(s))) return false;

    const equivalentChunkLength = endByIpV4 ? hexaChunks.length + 2 : hexaChunks.length;
    return firstElision !== -1 ? equivalentChunkLength < 8 : equivalentChunkLength === 8;
  };

  const ipV6Builder = () => ipV6();

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(ipV6Builder);
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(ipV6Builder, isCorrect);
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(ipV6Builder);
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(ipV6Builder);
  });

  it.each`
    source
    ${'::1'}
    ${'0123:5678:9abc:ef01:2345:6789:128.0.0.1'}
    ${'0123:5678:9abc:ef01:2345:6789:0000:ffff'}
    ${'0:56:9abc:ef01:234:67:8.8.8.8'}
    ${'0:56:9abc:ef01:234:67:0:f'}
    ${'::5678:9abc:ef01:2345:6789:128.0.0.1'}
    ${'::5678:9abc:ef01:2345:6789:0000:ffff'}
    ${'::9abc:ef01:2345:6789:128.0.0.1'}
    ${'::9abc:ef01:2345:6789:0000:ffff'}
    ${'5678::9abc:ef01:2345:6789:128.0.0.1'}
    ${'5678::9abc:ef01:2345:6789:0000:ffff'}
    ${'::ef01:2345:6789:128.0.0.1'}
    ${'::ef01:2345:6789:0000:ffff'}
    ${'9abc::ef01:2345:6789:128.0.0.1'}
    ${'9abc::ef01:2345:6789:0000:ffff'}
    ${'5678:9abc::ef01:2345:6789:128.0.0.1'}
    ${'5678:9abc::ef01:2345:6789:0000:ffff'}
    ${'::2345:6789:128.0.0.1'}
    ${'::2345:6789:0000:ffff'}
    ${'ef01::2345:6789:128.0.0.1'}
    ${'ef01::2345:6789:0000:ffff'}
    ${'9abc:ef01::2345:6789:128.0.0.1'}
    ${'9abc:ef01::2345:6789:0000:ffff'}
    ${'5678:9abc:ef01::2345:6789:128.0.0.1'}
    ${'5678:9abc:ef01::2345:6789:0000:ffff'}
    ${'::6789:128.0.0.1'}
    ${'::6789:0000:ffff'}
    ${'2345::6789:128.0.0.1'}
    ${'2345::6789:0000:ffff'}
    ${'ef01:2345::6789:128.0.0.1'}
    ${'ef01:2345::6789:0000:ffff'}
    ${'9abc:ef01:2345::6789:128.0.0.1'}
    ${'9abc:ef01:2345::6789:0000:ffff'}
    ${'5678:9abc:ef01:2345::6789:128.0.0.1'}
    ${'5678:9abc:ef01:2345::6789:0000:ffff'}
    ${'::128.0.0.1'}
    ${'::0000:ffff'}
    ${'2345::128.0.0.1'}
    ${'2345::0000:ffff'}
    ${'ef01:2345::128.0.0.1'}
    ${'ef01:2345::0000:ffff'}
    ${'9abc:ef01:2345::128.0.0.1'}
    ${'9abc:ef01:2345::0000:ffff'}
    ${'5678:9abc:ef01:2345::128.0.0.1'}
    ${'5678:9abc:ef01:2345::0000:ffff'}
    ${'0123:5678:9abc:ef01:2345::128.0.0.1'}
    ${'0123:5678:9abc:ef01:2345::0000:ffff'}
    ${'::0123'}
    ${'6789::0123'}
    ${'2345:6789::0123'}
    ${'ef01:2345:6789::0123'}
    ${'9abc:ef01:2345:6789::0123'}
    ${'5678:9abc:ef01:2345:6789::0123'}
    ${'0123:5678:9abc:ef01:2345:6789::0123'}
    ${'::'}
    ${'0123::'}
    ${'6789:0123::'}
    ${'2345:6789:0123::'}
    ${'ef01:2345:6789:0123::'}
    ${'9abc:ef01:2345:6789:0123::'}
    ${'5678:9abc:ef01:2345:6789:0123::'}
    ${'0123:5678:9abc:ef01:2345:6789:0123::'}
  `('should be able to generate $source with fc.ipV6()', ({ source }) => {
    // Arrange / Act
    const arb = ipV6();
    const out = arb.canShrinkWithoutContext(source);

    // Assert
    expect(out).toBe(true);
  });

  it.each`
    rawValue
    ${'::1'}
    ${'0123:5678:9abc:ef01:2345:6789:128.0.0.1'}
  `('should be able to shrink $rawValue', ({ rawValue }) => {
    // Arrange
    const arb = ipV6();
    const value = new Value(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});

import { ipV4 } from '../../../src/arbitrary/ipV4';

import { Value } from '../../../src/check/arbitrary/definition/Value';
import {
  assertValidArbitrary
} from './__test-helpers__/ArbitraryAssertions';
import { buildShrinkTree, renderTree } from './__test-helpers__/ShrinkTree';

describe('ipV4 (integration)', () => {
  const isCorrect = (value: string) => {
    expect(value).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    for (const item of value.split('.')) {
      expect(Number(item)).not.toBeNaN();
      expect(Number(item)).toBeGreaterThanOrEqual(0);
      expect(Number(item)).toBeLessThanOrEqual(255);
    }
  };

  const ipV4Builder = () => ipV4();

  it('should be a valid arbitrary', () => {
    assertValidArbitrary(
      ipV4Builder,
      {
        sameValueGivenSameSeed: {},
        correctValues: { isCorrect },
        shrinkableWithoutContext: {},
        sameValueWithoutInitialContext: {},
      },
    );
  });

  it.each`
    source
    ${'0.0.0.0'}
    ${'255.255.255.255'}
  `('should be able to generate $source with fc.ipV4()', ({ source }) => {
    // Arrange / Act
    const arb = ipV4();
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
    const arb = ipV4();
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
    const arb = ipV4();
    const value = new Value(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});

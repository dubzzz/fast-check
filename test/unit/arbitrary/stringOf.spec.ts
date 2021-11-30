import * as fc from '../../../lib/fast-check';
import { stringOf } from '../../../src/arbitrary/stringOf';

import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';
import { Value } from '../../../src/check/arbitrary/definition/Value';
import { Random } from '../../../src/random/generator/Random';
import { Stream } from '../../../src/stream/Stream';
import {
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
} from './__test-helpers__/NextArbitraryAssertions';
import { buildNextShrinkTree, renderTree } from './__test-helpers__/ShrinkTree';

describe('stringOf (integration)', () => {
  type Extra = { minLength?: number; maxLength?: number; patterns: string[] };
  const extraParameters: fc.Arbitrary<Extra> = fc
    .tuple(
      fc.nat({ max: 5 }),
      fc.nat({ max: 30 }),
      fc.boolean(),
      fc.boolean(),
      // empty string not supported when trying to recognize stuff geenrated by this precise arbitrary
      fc.array(fc.fullUnicodeString({ minLength: 1 }), { minLength: 1 })
    )
    .map(([min, gap, withMin, withMax, patterns]) => ({
      minLength: withMin ? min : undefined,
      maxLength: withMax ? min + gap : undefined,
      patterns,
    }));

  const stringOfBuilder = (extra: Extra) => stringOf(new PatternsArbitrary(extra.patterns), extra);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(stringOfBuilder, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(stringOfBuilder, { extraParameters });
  });

  // assertShrinkProducesSameValueWithoutInitialContext is not fully supported by stringOf
  // Indeed depending how much the source strings overlaps there are possibly many possible ways to build a given string
  // so also many possible ways to shrink it.

  it.each`
    source                             | patterns        | constraints
    ${'.__..' /* not from patterns */} | ${['..', '__']} | ${{}}
    ${'__..' /* not large enough */}   | ${['..', '__']} | ${{ minLength: 3 }}
    ${'__..__..' /* too large */}      | ${['..', '__']} | ${{ maxLength: 3 }}
  `(
    'should not be able to generate $source with fc.stringOf(arb($patterns), $constraints)',
    ({ source, patterns, constraints }) => {
      // Arrange / Act
      const arb = stringOf(new PatternsArbitrary(patterns), constraints);
      const out = arb.canShrinkWithoutContext(source);

      // Assert
      expect(out).toBe(false);
    }
  );

  it.each`
    rawValue                                                                          | patterns
    ${'CccABbBbCcc'}                                                                  | ${['A', 'Bb', 'Ccc']}
    ${'_._.____...'}                                                                  | ${['._', '_...', '_._.', '_..', '.', '.._.', '__.', '....', '..', '.___', '._..', '__', '_.', '___', '.__.', '__._', '._.', '...', '_', '.._', '..._', '.__', '_.._', '_.__', '__..']}
    ${'..'.repeat(50) /* longer than default maxGeneratedLength but ok for shrink */} | ${['..', '__']}
  `('should be able to shrink $rawValue', ({ rawValue, patterns }) => {
    // Arrange
    const arb = stringOf(new PatternsArbitrary(patterns));
    const value = new Value(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildNextShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});

// Helpers

class PatternsArbitrary extends Arbitrary<string> {
  constructor(readonly patterns: string[]) {
    super();
  }
  generate(mrng: Random): Value<string> {
    return new Value(this.patterns[mrng.nextInt(0, this.patterns.length - 1)], undefined);
  }
  canShrinkWithoutContext(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    return this.patterns.includes(value);
  }
  shrink(value: string): Stream<Value<string>> {
    const patternIndex = this.patterns.indexOf(value);
    if (patternIndex <= 0) {
      return Stream.nil();
    }
    return Stream.of(new Value(this.patterns[0], undefined));
  }
}

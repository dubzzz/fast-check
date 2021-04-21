import fc from '../../../../lib/fast-check';
import { CloneArbitrary } from '../../../../src/arbitrary/_internals/CloneArbitrary';
import { NextArbitrary } from '../../../../src/check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';
import { cloneMethod, hasCloneMethod } from '../../../../src/check/symbols';
import { Random } from '../../../../src/random/generator/Random';
import { Stream } from '../../../../src/stream/Stream';
import {
  assertGenerateProducesCorrectValues,
  assertGenerateProducesSameValueGivenSameSeed,
  assertGenerateProducesValuesFlaggedAsCanGenerate,
  assertShrinkProducesCorrectValues,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesStrictlySmallerValue,
  assertShrinkProducesValuesFlaggedAsCanGenerate,
} from '../../check/arbitrary/generic/NextArbitraryAssertions';
import { FakeIntegerArbitrary, fakeNextArbitrary } from '../../check/arbitrary/generic/NextArbitraryHelpers';
import { fakeRandom } from '../../check/arbitrary/generic/RandomHelpers';
import { buildNextShrinkTree, renderTree } from '../../check/arbitrary/generic/ShrinkTree';

describe('CloneArbitrary', () => {
  describe('generate', () => {
    it('should call generate numValues times on the passed arbitrary', () => {
      // Arrange
      const numValues = 3;
      const biasFactor = 48;
      const producedValue = Symbol();
      const { instance: mrng, clone } = fakeRandom();
      const { instance: mrngClone1 } = fakeRandom();
      const { instance: mrngClone2 } = fakeRandom();
      clone.mockReturnValueOnce(mrngClone1).mockReturnValueOnce(mrngClone2);
      const { instance: sourceArb, generate } = fakeNextArbitrary<symbol>();
      generate.mockReturnValue(new NextValue(producedValue));

      // Act
      const arb = new CloneArbitrary(sourceArb, numValues);
      const out = arb.generate(mrng, biasFactor);

      // Assert
      expect(out.value).toEqual([producedValue, producedValue, producedValue]);
      expect(generate).toHaveBeenCalledTimes(3);
      expect(generate).toHaveBeenCalledWith(mrngClone1, biasFactor);
      expect(generate).toHaveBeenCalledWith(mrngClone2, biasFactor);
      expect(generate).toHaveBeenLastCalledWith(mrng, biasFactor);
    });

    it.each`
      type               | cloneable
      ${'non-cloneable'} | ${false}
      ${'cloneable'}     | ${true}
    `('should produce a $type tuple when sub-value is $type', ({ cloneable }) => {
      // Arrange
      const numValues = 1;
      const { instance: mrng } = fakeRandom();
      const { instance: sourceArb, generate } = fakeNextArbitrary<unknown>();
      if (cloneable) generate.mockReturnValue(new NextValue({ [cloneMethod]: jest.fn() }));
      else generate.mockReturnValue(new NextValue({ m: jest.fn() }));

      // Act
      const arb = new CloneArbitrary(sourceArb, numValues);
      const out = arb.generate(mrng, numValues);

      // Assert
      expect(out.hasToBeCloned).toBe(cloneable);
      expect(hasCloneMethod(out.value)).toBe(cloneable);
    });
  });

  describe('canGenerate', () => {
    it('should return false if passed value does not have the right length', () =>
      fc.assert(
        fc.property(fc.nat({ max: 1000 }), fc.nat({ max: 1000 }), (numValues, numRequestedValues) => {
          // Arrange
          fc.pre(numValues !== numRequestedValues);
          const { instance: sourceArb, canGenerate } = fakeNextArbitrary();

          // Act
          const arb = new CloneArbitrary(sourceArb, numValues);
          const out = arb.canGenerate([...Array(numRequestedValues)]);

          // Assert
          expect(out).toBe(false);
          expect(canGenerate).not.toHaveBeenCalled();
        })
      ));

    it('should return false if values are not equal regarding Object.is', () => {
      // Arrange
      const { instance: sourceArb, canGenerate } = fakeNextArbitrary();

      // Act
      const arb = new CloneArbitrary(sourceArb, 2);
      const out = arb.canGenerate([{}, {}]);

      // Assert
      expect(out).toBe(false);
      expect(canGenerate).not.toHaveBeenCalled();
    });

    it.each`
      canGenerateValue
      ${true}
      ${false}
    `(
      'should ask sub-arbitrary whenever length is correct and children are equal regarding Object.is',
      ({ canGenerateValue }) => {
        // Arrange
        const value = {};
        const { instance: sourceArb, canGenerate } = fakeNextArbitrary();
        canGenerate.mockReturnValue(canGenerateValue);

        // Act
        const arb = new CloneArbitrary(sourceArb, 2);
        const out = arb.canGenerate([value, value]);

        // Assert
        expect(out).toBe(canGenerateValue);
        expect(canGenerate).toHaveBeenCalledTimes(1);
        expect(canGenerate).toHaveBeenCalledWith(value);
      }
    );
  });

  describe('shrink', () => {
    it('should shrink numValues times the value and zip the outputs together', () => {
      // Arrange
      const value = Symbol();
      const s1 = Symbol();
      const s2 = Symbol();
      const numValues = 3;
      const { instance: sourceArb, shrink } = fakeNextArbitrary<symbol>();
      shrink
        .mockReturnValueOnce(Stream.of<NextValue<symbol>>(new NextValue(s1), new NextValue(s2)))
        .mockReturnValueOnce(Stream.of<NextValue<symbol>>(new NextValue(s1), new NextValue(s2)))
        .mockReturnValueOnce(Stream.of<NextValue<symbol>>(new NextValue(s1), new NextValue(s2)));

      // Act
      const arb = new CloneArbitrary(sourceArb, numValues);
      const shrinks = [...arb.shrink([value, value, value])];

      // Assert
      expect(shrinks.map((v) => v.value)).toEqual([
        [s1, s1, s1],
        [s2, s2, s2],
      ]);
      expect(shrink).toHaveBeenCalledTimes(3);
      expect(shrink).toHaveBeenCalledWith(value, undefined);
    });
  });
});

describe('CloneArbitrary (integration)', () => {
  type Extra = number;
  const extraParameters: fc.Arbitrary<Extra> = fc.nat({ max: 100 });

  const isCorrect = (value: number[], extra: Extra) =>
    Array.isArray(value) && value.length === extra && new Set(value).size <= 1;

  // Should never be called for extra = 0
  const isStrictlySmaller = (t1: number[], t2: number[]) => t1[0] < t2[0];

  const cloneBuilder = (extra: Extra) => new CloneArbitrary(new FakeIntegerArbitrary(), extra);

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(cloneBuilder, { extraParameters });
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(cloneBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during generate (only when equal regarding Object.is)', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(cloneBuilder, { extraParameters });
  });

  it('should shrink towards the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(cloneBuilder, { extraParameters });
  });

  it('should be able to shrink without any context if underlyings do', () => {
    assertShrinkProducesSameValueWithoutInitialContext(cloneBuilder, { extraParameters });
  });

  it('should only shrink towards correct values', () => {
    assertShrinkProducesCorrectValues(cloneBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during shrink (only when equal regarding Object.is)', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(cloneBuilder, { extraParameters });
  });

  it('should preserve strictly smaller ordering in shrink (underlyings do)', () => {
    assertShrinkProducesStrictlySmallerValue(cloneBuilder, isStrictlySmaller, { extraParameters });
  });

  it('should produce the right shrinking tree', () => {
    // Arrange
    const arb = new CloneArbitrary(new FirstArbitrary(), 5);
    const { instance: mrng } = fakeRandom();

    // Act
    const g = arb.generate(mrng, undefined);
    const renderedTree = renderTree(buildNextShrinkTree(arb, g)).join('\n');

    // Assert
    expect(renderedTree).toMatchInlineSnapshot(`
      "[4,4,4,4,4]
      ├> [2,2,2,2,2]
      |  └> [0,0,0,0,0]
      └> [3,3,3,3,3]
         ├> [0,0,0,0,0]
         └> [1,1,1,1,1]"
    `);
  });
});

// Helpers

const expectedFirst = 4;

class FirstArbitrary extends NextArbitrary<number> {
  generate(_mrng: Random): NextValue<number> {
    return new NextValue(expectedFirst, { step: 2 });
  }
  canGenerate(_value: unknown): _value is number {
    throw new Error('No call expected in that scenario');
  }
  shrink(value: number, context?: unknown): Stream<NextValue<number>> {
    if (typeof context !== 'object' || context === null || !('step' in context)) {
      throw new Error('Invalid context for FirstArbitrary');
    }
    if (value <= 0) {
      return Stream.nil();
    }
    const currentStep = (context as { step: number }).step;
    const nextStep = currentStep + 1;
    return Stream.of(
      ...(value - currentStep >= 0 ? [new NextValue(value - currentStep, { step: nextStep })] : []),
      ...(value - currentStep + 1 >= 0 ? [new NextValue(value - currentStep + 1, { step: nextStep })] : [])
    );
  }
}

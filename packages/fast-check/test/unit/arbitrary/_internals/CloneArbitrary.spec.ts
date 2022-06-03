import fc from '../../../../lib/fast-check';
import { CloneArbitrary } from '../../../../src/arbitrary/_internals/CloneArbitrary';
import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { Value } from '../../../../src/check/arbitrary/definition/Value';
import { cloneMethod, hasCloneMethod } from '../../../../src/check/symbols';
import { Random } from '../../../../src/random/generator/Random';
import { Stream } from '../../../../src/stream/Stream';
import {
  assertProduceValuesShrinkableWithoutContext,
  assertProduceCorrectValues,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesStrictlySmallerValue,
  assertProduceSameValueGivenSameSeed,
} from '../__test-helpers__/ArbitraryAssertions';
import { FakeIntegerArbitrary, fakeArbitrary } from '../__test-helpers__/ArbitraryHelpers';
import { fakeRandom } from '../__test-helpers__/RandomHelpers';
import { buildShrinkTree, renderTree, walkTree } from '../__test-helpers__/ShrinkTree';

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
      const { instance: sourceArb, generate } = fakeArbitrary<symbol>();
      generate.mockReturnValue(new Value(producedValue, undefined));

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
      const { instance: sourceArb, generate } = fakeArbitrary<unknown>();
      if (cloneable) generate.mockReturnValue(new Value({ [cloneMethod]: jest.fn() }, undefined));
      else generate.mockReturnValue(new Value({ m: jest.fn() }, undefined));

      // Act
      const arb = new CloneArbitrary(sourceArb, numValues);
      const out = arb.generate(mrng, numValues);

      // Assert
      expect(out.hasToBeCloned).toBe(cloneable);
      expect(hasCloneMethod(out.value)).toBe(cloneable);
    });
  });

  describe('canShrinkWithoutContext', () => {
    it('should return false if passed value does not have the right length', () =>
      fc.assert(
        fc.property(fc.nat({ max: 1000 }), fc.nat({ max: 1000 }), (numValues, numRequestedValues) => {
          // Arrange
          fc.pre(numValues !== numRequestedValues);
          const { instance: sourceArb, canShrinkWithoutContext } = fakeArbitrary();

          // Act
          const arb = new CloneArbitrary(sourceArb, numValues);
          const out = arb.canShrinkWithoutContext([...Array(numRequestedValues)]);

          // Assert
          expect(out).toBe(false);
          expect(canShrinkWithoutContext).not.toHaveBeenCalled();
        })
      ));

    it('should return false if values are not equal regarding Object.is', () => {
      // Arrange
      const { instance: sourceArb, canShrinkWithoutContext } = fakeArbitrary();

      // Act
      const arb = new CloneArbitrary(sourceArb, 2);
      const out = arb.canShrinkWithoutContext([{}, {}]);

      // Assert
      expect(out).toBe(false);
      expect(canShrinkWithoutContext).not.toHaveBeenCalled();
    });

    it.each`
      canShrinkWithoutContextValue
      ${true}
      ${false}
    `(
      'should ask sub-arbitrary whenever length is correct and children are equal regarding Object.is',
      ({ canShrinkWithoutContextValue }) => {
        // Arrange
        const value = {};
        const { instance: sourceArb, canShrinkWithoutContext } = fakeArbitrary();
        canShrinkWithoutContext.mockReturnValue(canShrinkWithoutContextValue);

        // Act
        const arb = new CloneArbitrary(sourceArb, 2);
        const out = arb.canShrinkWithoutContext([value, value]);

        // Assert
        expect(out).toBe(canShrinkWithoutContextValue);
        expect(canShrinkWithoutContext).toHaveBeenCalledTimes(1);
        expect(canShrinkWithoutContext).toHaveBeenCalledWith(value);
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
      const { instance: sourceArb, shrink } = fakeArbitrary<symbol>();
      shrink
        .mockReturnValueOnce(Stream.of<Value<symbol>>(new Value(s1, undefined), new Value(s2, undefined)))
        .mockReturnValueOnce(Stream.of<Value<symbol>>(new Value(s1, undefined), new Value(s2, undefined)))
        .mockReturnValueOnce(Stream.of<Value<symbol>>(new Value(s1, undefined), new Value(s2, undefined)));

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

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(cloneBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(cloneBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    // Only when equal regarding Object.is
    assertProduceValuesShrinkableWithoutContext(cloneBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context (if underlyings do)', () => {
    assertShrinkProducesSameValueWithoutInitialContext(cloneBuilder, { extraParameters });
  });

  it('should preserve strictly smaller ordering in shrink (if underlyings do)', () => {
    assertShrinkProducesStrictlySmallerValue(cloneBuilder, isStrictlySmaller, { extraParameters });
  });

  it('should produce the right shrinking tree', () => {
    // Arrange
    const arb = new CloneArbitrary(new FirstArbitrary(), 5);
    const { instance: mrng } = fakeRandom();

    // Act
    const g = arb.generate(mrng, undefined);
    const renderedTree = renderTree(buildShrinkTree(arb, g)).join('\n');

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

  it('should not re-use twice the same instance of cloneable', () => {
    // Arrange
    const alreadySeenCloneable = new Set<unknown>();
    const arb = new CloneArbitrary(new CloneableArbitrary(), 5);
    const { instance: mrng } = fakeRandom();

    // Act
    const g = arb.generate(mrng, undefined);
    const treeA = buildShrinkTree(arb, g);
    const treeB = buildShrinkTree(arb, g);

    // Assert
    walkTree(treeA, ([_first, cloneable, _second]) => {
      expect(alreadySeenCloneable.has(cloneable)).toBe(false);
      alreadySeenCloneable.add(cloneable);
    });
    walkTree(treeB, ([_first, cloneable, _second]) => {
      expect(alreadySeenCloneable.has(cloneable)).toBe(false);
      alreadySeenCloneable.add(cloneable);
    });
  });
});

// Helpers

const expectedFirst = 4;

class FirstArbitrary extends Arbitrary<number> {
  generate(_mrng: Random): Value<number> {
    return new Value(expectedFirst, { step: 2 });
  }
  canShrinkWithoutContext(_value: unknown): _value is number {
    throw new Error('No call expected in that scenario');
  }
  shrink(value: number, context?: unknown): Stream<Value<number>> {
    if (typeof context !== 'object' || context === null || !('step' in context)) {
      throw new Error('Invalid context for FirstArbitrary');
    }
    if (value <= 0) {
      return Stream.nil();
    }
    const currentStep = (context as { step: number }).step;
    const nextStep = currentStep + 1;
    return Stream.of(
      ...(value - currentStep >= 0 ? [new Value(value - currentStep, { step: nextStep })] : []),
      ...(value - currentStep + 1 >= 0 ? [new Value(value - currentStep + 1, { step: nextStep })] : [])
    );
  }
}

class CloneableArbitrary extends Arbitrary<number[]> {
  private instance() {
    return Object.defineProperty([], cloneMethod, { value: () => this.instance() });
  }
  generate(_mrng: Random): Value<number[]> {
    return new Value(this.instance(), { shrunkOnce: false });
  }
  canShrinkWithoutContext(_value: unknown): _value is number[] {
    throw new Error('No call expected in that scenario');
  }
  shrink(value: number[], context?: unknown): Stream<Value<number[]>> {
    if (typeof context !== 'object' || context === null || !('shrunkOnce' in context)) {
      throw new Error('Invalid context for CloneableArbitrary');
    }
    const safeContext = context as { shrunkOnce: boolean };
    if (safeContext.shrunkOnce) {
      return Stream.nil();
    }
    return Stream.of(new Value(this.instance(), { shrunkOnce: true }));
  }
}

import { TupleArbitrary } from '../../../../src/arbitrary/_internals/TupleArbitrary';
import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';
import { FakeIntegerArbitrary, fakeNextArbitrary } from '../../check/arbitrary/generic/NextArbitraryHelpers';
import { fakeRandom } from '../../check/arbitrary/generic/RandomHelpers';
import { cloneMethod, hasCloneMethod } from '../../../../src/check/symbols';
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
import { buildNextShrinkTree, renderTree, walkTree } from '../../check/arbitrary/generic/ShrinkTree';
import { NextArbitrary } from '../../../../src/check/arbitrary/definition/NextArbitrary';
import { Random } from '../../../../src/random/generator/Random';

describe('TupleArbitrary', () => {
  describe('generate', () => {
    it('should merge results coming from underlyings and call them with the exact same inputs as the received ones', () => {
      // Arrange
      const expectedBiasFactor = 48;
      const vA = Symbol();
      const vB = Symbol();
      const vC = Symbol();
      const { instance: instanceA, generate: generateA } = fakeNextArbitrary<symbol>();
      const { instance: instanceB, generate: generateB } = fakeNextArbitrary<symbol>();
      const { instance: instanceC, generate: generateC } = fakeNextArbitrary<symbol>();
      generateA.mockReturnValueOnce(new NextValue(vA));
      generateB.mockReturnValueOnce(new NextValue(vB));
      generateC.mockReturnValueOnce(new NextValue(vC));
      const { instance: mrng } = fakeRandom();

      // Act
      const arb = new TupleArbitrary([instanceA, instanceB, instanceC]);
      const g = arb.generate(mrng, expectedBiasFactor);

      // Assert
      expect(g.value).toEqual([vA, vB, vC]);
      expect(generateA).toHaveBeenCalledWith(mrng, expectedBiasFactor);
      expect(generateB).toHaveBeenCalledWith(mrng, expectedBiasFactor);
      expect(generateC).toHaveBeenCalledWith(mrng, expectedBiasFactor);
    });

    it('should produce a cloneable instance if provided one cloneable underlying', () => {
      // Arrange
      const { instance: fakeArbitraryNotCloneableA, generate: generateA } = fakeNextArbitrary<string[]>();
      const { instance: fakeArbitraryCloneableB, generate: generateB } = fakeNextArbitrary<string[]>();
      generateA.mockReturnValue(new NextValue([]));
      generateB.mockReturnValue(new NextValue(Object.defineProperty([], cloneMethod, { value: jest.fn() })));
      const { instance: mrng } = fakeRandom();

      // Act
      const arb = new TupleArbitrary([fakeArbitraryNotCloneableA, fakeArbitraryCloneableB]);
      const g = arb.generate(mrng, undefined);

      // Assert
      expect(g.hasToBeCloned).toBe(true);
      expect(hasCloneMethod(g.value)).toBe(true);
    });

    it('should not produce a cloneable instance if no cloneable underlyings', () => {
      // Arrange
      const { instance: fakeArbitraryNotCloneableA, generate: generateA } = fakeNextArbitrary<string[]>();
      const { instance: fakeArbitraryNotCloneableB, generate: generateB } = fakeNextArbitrary<string[]>();
      generateA.mockReturnValue(new NextValue([]));
      generateB.mockReturnValue(new NextValue([]));
      const { instance: mrng } = fakeRandom();

      // Act
      const arb = new TupleArbitrary([fakeArbitraryNotCloneableA, fakeArbitraryNotCloneableB]);
      const g = arb.generate(mrng, undefined);

      // Assert
      expect(g.hasToBeCloned).toBe(false);
      expect(hasCloneMethod(g.value)).toBe(false);
    });

    it('should not clone cloneable on generate', () => {
      // Arrange
      const { instance: fakeArbitraryNotCloneableA, generate: generateA } = fakeNextArbitrary<string[]>();
      const { instance: fakeArbitraryCloneableB, generate: generateB } = fakeNextArbitrary<string[]>();
      const cloneMethodImpl = jest.fn();
      generateA.mockReturnValue(new NextValue([]));
      generateB.mockReturnValue(new NextValue(Object.defineProperty([], cloneMethod, { value: cloneMethodImpl })));
      const { instance: mrng } = fakeRandom();

      // Act
      const arb = new TupleArbitrary([fakeArbitraryNotCloneableA, fakeArbitraryCloneableB]);
      arb.generate(mrng, undefined);

      // Assert
      expect(cloneMethodImpl).not.toHaveBeenCalled();
    });
  });

  describe('canShrinkWithoutContext', () => {
    it.each`
      canA     | canB     | canC
      ${false} | ${false} | ${false}
      ${false} | ${true}  | ${true}
      ${true}  | ${false} | ${true}
      ${true}  | ${true}  | ${false}
      ${true}  | ${true}  | ${true}
    `(
      'should merge results coming from underlyings for canShrinkWithoutContext if received array has the right size',
      ({ canA, canB, canC }) => {
        // Arrange
        const vA = Symbol();
        const vB = Symbol();
        const vC = Symbol();
        const { instance: instanceA, canShrinkWithoutContext: canShrinkWithoutContextA } = fakeNextArbitrary<symbol>();
        const { instance: instanceB, canShrinkWithoutContext: canShrinkWithoutContextB } = fakeNextArbitrary<symbol>();
        const { instance: instanceC, canShrinkWithoutContext: canShrinkWithoutContextC } = fakeNextArbitrary<symbol>();
        canShrinkWithoutContextA.mockReturnValueOnce(canA);
        canShrinkWithoutContextB.mockReturnValueOnce(canB);
        canShrinkWithoutContextC.mockReturnValueOnce(canC);

        // Act
        const arb = new TupleArbitrary([instanceA, instanceB, instanceC]);
        const out = arb.canShrinkWithoutContext([vA, vB, vC]);

        // Assert
        expect(out).toBe(canA && canB && canC);
        expect(canShrinkWithoutContextA).toHaveBeenCalledWith(vA);
        if (canA) expect(canShrinkWithoutContextB).toHaveBeenCalledWith(vB);
        else expect(canShrinkWithoutContextB).not.toHaveBeenCalled();
        if (canA && canB) expect(canShrinkWithoutContextC).toHaveBeenCalledWith(vC);
        else expect(canShrinkWithoutContextC).not.toHaveBeenCalled();
      }
    );

    it('should not call underlyings on canShrinkWithoutContext if size is invalid', () => {
      // Arrange
      const { instance: instanceA, canShrinkWithoutContext: canShrinkWithoutContextA } = fakeNextArbitrary<symbol>();
      const { instance: instanceB, canShrinkWithoutContext: canShrinkWithoutContextB } = fakeNextArbitrary<symbol>();
      const { instance: instanceC, canShrinkWithoutContext: canShrinkWithoutContextC } = fakeNextArbitrary<symbol>();

      // Act
      const arb = new TupleArbitrary([instanceA, instanceB, instanceC]);
      const out = arb.canShrinkWithoutContext([Symbol(), Symbol(), Symbol(), Symbol()]);

      // Assert
      expect(out).toBe(false);
      expect(canShrinkWithoutContextA).not.toHaveBeenCalled();
      expect(canShrinkWithoutContextB).not.toHaveBeenCalled();
      expect(canShrinkWithoutContextC).not.toHaveBeenCalled();
    });
  });

  describe('shrink', () => {
    it('should call back arbitraries on shrink with the initially returned contextq', () => {
      // Arrange
      const expectedBiasFactor = 48;
      const vA = Symbol();
      const vB = Symbol();
      const vC = Symbol();
      const contextA = Symbol();
      const contextB = Symbol();
      const contextC = Symbol();
      const { instance: instanceA, generate: generateA, shrink: shrinkA } = fakeNextArbitrary<symbol>();
      const { instance: instanceB, generate: generateB, shrink: shrinkB } = fakeNextArbitrary<symbol>();
      const { instance: instanceC, generate: generateC, shrink: shrinkC } = fakeNextArbitrary<symbol>();
      generateA.mockReturnValueOnce(new NextValue(vA, contextA));
      generateB.mockReturnValueOnce(new NextValue(vB, contextB));
      generateC.mockReturnValueOnce(new NextValue(vC, contextC));
      const shrinkA1 = Symbol();
      const shrinkA2 = Symbol();
      const shrinkB1 = Symbol();
      const shrinkC1 = Symbol();
      const shrinkC2 = Symbol();
      const shrinkC3 = Symbol();
      shrinkA.mockReturnValueOnce(Stream.of(new NextValue(shrinkA1 as symbol), new NextValue(shrinkA2)));
      shrinkB.mockReturnValueOnce(Stream.of(new NextValue(shrinkB1 as symbol)));
      shrinkC.mockReturnValueOnce(
        Stream.of(new NextValue(shrinkC1 as symbol), new NextValue(shrinkC2), new NextValue(shrinkC3))
      );
      const { instance: mrng } = fakeRandom();

      // Act
      const arb = new TupleArbitrary([instanceA, instanceB, instanceC]);
      const g = arb.generate(mrng, expectedBiasFactor);
      const shrinks = [...arb.shrink(g.value, g.context)];

      // Assert
      expect(shrinks).toHaveLength(2 /* A */ + 1 /* B */ + 3 /* C */);
      expect(shrinks.map((v) => v.value)).toEqual([
        [shrinkA1, vB, vC],
        [shrinkA2, vB, vC],
        [vA, shrinkB1, vC],
        [vA, vB, shrinkC1],
        [vA, vB, shrinkC2],
        [vA, vB, shrinkC3],
      ]);
      expect(shrinkA).toHaveBeenCalledWith(vA, contextA);
      expect(shrinkB).toHaveBeenCalledWith(vB, contextB);
      expect(shrinkC).toHaveBeenCalledWith(vC, contextC);
    });

    it('should clone cloneable on shrink', () => {
      // Arrange
      const {
        instance: fakeArbitraryNotCloneableA,
        generate: generateA,
        shrink: shrinkA,
      } = fakeNextArbitrary<string[]>();
      const { instance: fakeArbitraryCloneableB, generate: generateB, shrink: shrinkB } = fakeNextArbitrary<string[]>();

      const {
        instance: fakeArbitraryNotCloneableC,
        generate: generateC,
        shrink: shrinkC,
      } = fakeNextArbitrary<string[]>();
      const cloneMethodImpl = jest
        .fn()
        .mockImplementation(() => Object.defineProperty([], cloneMethod, { value: cloneMethodImpl }));
      generateA.mockReturnValue(new NextValue([]));
      shrinkA.mockReturnValue(Stream.of(new NextValue([]), new NextValue([])));
      generateB.mockReturnValue(new NextValue(Object.defineProperty([], cloneMethod, { value: cloneMethodImpl })));
      shrinkB.mockReturnValue(
        Stream.of(
          new NextValue(Object.defineProperty([], cloneMethod, { value: cloneMethodImpl })),
          new NextValue(Object.defineProperty([], cloneMethod, { value: cloneMethodImpl })),
          new NextValue(Object.defineProperty([], cloneMethod, { value: cloneMethodImpl }))
        )
      );
      generateC.mockReturnValue(new NextValue([]));
      shrinkC.mockReturnValue(Stream.of(new NextValue([]), new NextValue([]), new NextValue([]), new NextValue([])));
      const { instance: mrng } = fakeRandom();

      // Act
      const arb = new TupleArbitrary([fakeArbitraryNotCloneableA, fakeArbitraryCloneableB, fakeArbitraryNotCloneableC]);
      const g = arb.generate(mrng, undefined);
      expect(cloneMethodImpl).not.toHaveBeenCalled();
      const shrinkLazy = arb.shrink(g.value, g.context);
      expect(cloneMethodImpl).not.toHaveBeenCalled();
      const shrinks = [...shrinkLazy];

      // Assert
      expect(shrinks).toHaveLength(2 /* A */ + 3 /* B */ + 4 /* C */);
      expect(cloneMethodImpl).toHaveBeenCalledTimes(shrinks.length);
    });
  });
});

describe('TupleArbitrary (integration)', () => {
  const isCorrect = (value: number[]) => Array.isArray(value) && value.length === 3;

  const isStrictlySmaller = (t1: number[], t2: number[]) => t1.findIndex((v, idx) => v < t2[idx]) !== -1;

  const tupleBuilder = () =>
    new TupleArbitrary([new FakeIntegerArbitrary(), new FakeIntegerArbitrary(), new FakeIntegerArbitrary()]);

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(tupleBuilder);
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(tupleBuilder, isCorrect);
  });

  it('should recognize values that would have been generated using it during generate', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(tupleBuilder);
  });

  it('should shrink towards the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(tupleBuilder);
  });

  it('should be able to shrink without any context if underlyings do', () => {
    assertShrinkProducesSameValueWithoutInitialContext(tupleBuilder);
  });

  it('should only shrink towards correct values', () => {
    assertShrinkProducesCorrectValues(tupleBuilder, isCorrect);
  });

  it('should recognize values that would have been generated using it during shrink', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(tupleBuilder);
  });

  it('should preserve strictly smaller ordering in shrink (underlyings do)', () => {
    assertShrinkProducesStrictlySmallerValue(tupleBuilder, isStrictlySmaller);
  });

  it('should produce the right shrinking tree', () => {
    // Arrange
    const arb = new TupleArbitrary([new FirstArbitrary(), new SecondArbitrary()]);
    const { instance: mrng } = fakeRandom();

    // Act
    const g = arb.generate(mrng, undefined);
    const renderedTree = renderTree(buildNextShrinkTree(arb, g)).join('\n');

    // Assert
    expect(g.hasToBeCloned).toBe(false);
    expect(g.value).toBe(g.value_);
    expect(g.value).toEqual([expectedFirst, expectedSecond]);
    expect(renderedTree).toMatchInlineSnapshot(`
      "[4,97]
      ├> [2,97]
      |  ├> [0,97]
      |  |  ├> [0,99]
      |  |  └> [0,98]
      |  |     └> [0,100]
      |  ├> [2,99]
      |  |  └> [0,99]
      |  └> [2,98]
      |     ├> [0,98]
      |     |  └> [0,100]
      |     └> [2,100]
      |        └> [0,100]
      ├> [3,97]
      |  ├> [0,97]
      |  |  ├> [0,99]
      |  |  └> [0,98]
      |  |     └> [0,100]
      |  ├> [1,97]
      |  |  ├> [1,99]
      |  |  └> [1,98]
      |  |     └> [1,100]
      |  ├> [3,99]
      |  |  ├> [0,99]
      |  |  └> [1,99]
      |  └> [3,98]
      |     ├> [0,98]
      |     |  └> [0,100]
      |     ├> [1,98]
      |     |  └> [1,100]
      |     └> [3,100]
      |        ├> [0,100]
      |        └> [1,100]
      ├> [4,99]
      |  ├> [2,99]
      |  |  └> [0,99]
      |  └> [3,99]
      |     ├> [0,99]
      |     └> [1,99]
      └> [4,98]
         ├> [2,98]
         |  ├> [0,98]
         |  |  └> [0,100]
         |  └> [2,100]
         |     └> [0,100]
         ├> [3,98]
         |  ├> [0,98]
         |  |  └> [0,100]
         |  ├> [1,98]
         |  |  └> [1,100]
         |  └> [3,100]
         |     ├> [0,100]
         |     └> [1,100]
         └> [4,100]
            ├> [2,100]
            |  └> [0,100]
            └> [3,100]
               ├> [0,100]
               └> [1,100]"
    `);
  });

  it('should not re-use twice the same instance of cloneable', () => {
    // Arrange
    const alreadySeenCloneable = new Set<unknown>();
    const arb = new TupleArbitrary([new FirstArbitrary(), new CloneableArbitrary(), new SecondArbitrary()]);
    const { instance: mrng } = fakeRandom();

    // Act
    const g = arb.generate(mrng, undefined);
    const treeA = buildNextShrinkTree(arb, g);
    const treeB = buildNextShrinkTree(arb, g);

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
const expectedSecond = 97;

class FirstArbitrary extends NextArbitrary<number> {
  generate(_mrng: Random): NextValue<number> {
    return new NextValue(expectedFirst, { step: 2 });
  }
  canShrinkWithoutContext(_value: unknown): _value is number {
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
class SecondArbitrary extends NextArbitrary<number> {
  generate(_mrng: Random): NextValue<number> {
    return new NextValue(expectedSecond, { step: 2 });
  }
  canShrinkWithoutContext(_value: unknown): _value is number {
    throw new Error('No call expected in that scenario');
  }
  shrink(value: number, context?: unknown): Stream<NextValue<number>> {
    if (typeof context !== 'object' || context === null || !('step' in context)) {
      throw new Error('Invalid context for SecondArbitrary');
    }
    if (value >= 100) {
      return Stream.nil();
    }
    const currentStep = (context as { step: number }).step;
    const nextStep = currentStep + 1;
    return Stream.of(
      ...(value + currentStep <= 100 ? [new NextValue(value + currentStep, { step: nextStep })] : []),
      ...(value + currentStep - 1 <= 100 ? [new NextValue(value + currentStep - 1, { step: nextStep })] : [])
    );
  }
}

class CloneableArbitrary extends NextArbitrary<number> {
  private instance() {
    return Object.defineProperty([], cloneMethod, { value: () => this.instance() });
  }
  generate(_mrng: Random): NextValue<number> {
    return new NextValue(this.instance(), { shrunkOnce: false });
  }
  canShrinkWithoutContext(_value: unknown): _value is number {
    throw new Error('No call expected in that scenario');
  }
  shrink(value: number, context?: unknown): Stream<NextValue<number>> {
    if (typeof context !== 'object' || context === null || !('shrunkOnce' in context)) {
      throw new Error('Invalid context for CloneableArbitrary');
    }
    const safeContext = context as { shrunkOnce: boolean };
    if (safeContext.shrunkOnce) {
      return Stream.nil();
    }
    return Stream.of(new NextValue(this.instance(), { shrunkOnce: true }));
  }
}

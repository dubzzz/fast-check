import { tuple as tupleOld } from '../../../../src/check/arbitrary/TupleArbitrary';

import { convertFromNext, convertToNext } from '../../../../src/check/arbitrary/definition/Converters';
import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { NextArbitrary } from '../../../../src/check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../../../src/check/arbitrary/definition/NextValue';
import { Random } from '../../../../src/random/generator/Random';
import { Stream } from '../../../../src/stream/Stream';

import * as stubRng from '../../stubs/generators';
import { buildNextShrinkTree, renderTree, walkTree } from './generic/ShrinkTree';
import {
  assertGenerateProducesCorrectValues,
  assertGenerateProducesSameValueGivenSameSeed,
  assertGenerateProducesValuesFlaggedAsCanGenerate,
  assertShrinkProducesCorrectValues,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesStrictlySmallerValue,
  assertShrinkProducesValuesFlaggedAsCanGenerate,
} from './generic/NextArbitraryAssertions';
import { FakeIntegerArbitrary } from './generic/NextArbitraryHelpers';
import { cloneMethod } from '../../../../src/check/symbols';

const mrngNoCall = stubRng.mutable.nocall();
function tuple<Ts extends unknown[]>(...arbs: { [K in keyof Ts]: NextArbitrary<Ts[K]> }): NextArbitrary<Ts> {
  const oldArbs = arbs.map((arb) => convertFromNext(arb)) as { [K in keyof Ts]: Arbitrary<Ts[K]> };
  return convertToNext(tupleOld<Ts>(...oldArbs));
}

describe('tuple', () => {
  const tupleBuilder = () => tuple(new FakeIntegerArbitrary(), new FakeIntegerArbitrary(), new FakeIntegerArbitrary());
  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(tupleBuilder);
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(tupleBuilder, (value) => Array.isArray(value) && value.length === 3);
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
    assertShrinkProducesCorrectValues(tupleBuilder, (value) => Array.isArray(value) && value.length === 3);
  });

  it('should recognize values that would have been generated using it during shrink', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(tupleBuilder);
  });

  it('should preserve strictly smaller ordering in shrink (underlyings do)', () => {
    assertShrinkProducesStrictlySmallerValue(tupleBuilder, (t1, t2) => t1.findIndex((v, idx) => v < t2[idx]) !== -1);
  });

  it('should produce the right shrinking tree', () => {
    // Arrange
    const arb = tuple(new FirstArbitrary(), new SecondArbitrary());

    // Act
    const g = arb.generate(mrngNoCall, undefined);
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
    const arb = tuple(new FirstArbitrary(), new CloneableArbitrary(), new SecondArbitrary());

    // Act
    const g = arb.generate(mrngNoCall, undefined);
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
class SecondArbitrary extends NextArbitrary<number> {
  generate(_mrng: Random): NextValue<number> {
    return new NextValue(expectedSecond, { step: 2 });
  }
  canGenerate(_value: unknown): _value is number {
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
  canGenerate(_value: unknown): _value is number {
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

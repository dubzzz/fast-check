import * as prand from 'pure-rand';
import * as fc from '../../../../../lib/fast-check';

import { NextArbitrary } from '../../../../../src/check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../../../../src/check/arbitrary/definition/NextValue';
import { Random } from '../../../../../src/random/generator/Random';

// Minimal requirements
// > The following assertions are supposed to be fulfilled by any of the arbitraries
// > provided by fast-check.

export function assertProduceSameValueGivenSameSeed<T, U = never>(
  arbitraryBuilder: (extraParameters: U) => NextArbitrary<T>,
  options: {
    isEqual?: (v1: T, v2: T, extraParameters: U) => void | boolean;
    noInitialContext?: boolean;
    extraParameters?: fc.Arbitrary<U>;
    assertParameters?: fc.Parameters<unknown>;
  } = {}
): void {
  const {
    isEqual,
    noInitialContext,
    extraParameters: extra = fc.constant(undefined as unknown as U) as fc.Arbitrary<U>,
    assertParameters,
  } = options;
  fc.assert(
    fc.property(
      fc.integer().noShrink(),
      biasFactorArbitrary(),
      fc.array(fc.nat(100), { minLength: 1 }),
      extra,
      (seed, biasFactor, shrinkPath, extraParameters) => {
        // Arrange
        const arb = arbitraryBuilder(extraParameters);

        // Act / Assert
        let g1: NextValue<T> | null = arb.generate(randomFromSeed(seed), biasFactor);
        let g2: NextValue<T> | null = arb.generate(randomFromSeed(seed), biasFactor);
        if (noInitialContext) {
          const originalG2 = g2!;
          g2 = new NextValue(originalG2.value_, undefined, () => originalG2.value);
        }
        let id = 0;
        while (g1 !== null && g2 !== null) {
          assertEquality(isEqual, g1.value, g2.value, extraParameters);
          g1 = arb.shrink(g1.value, g1.context).getNthOrLast(id);
          g2 = arb.shrink(g2.value, g2.context).getNthOrLast(id);
          id = (id + 1) % shrinkPath.length;
        }
        expect(g1).toBe(null);
        expect(g2).toBe(null);
      }
    ),
    assertParameters
  );
}

// Optional requirements
// > The following requirements are optional as they do not break the design of fast-check when they are not totally ensured
// > But some of them are really recommended to build valid arbitraries that can be used.

export function assertProduceCorrectValues<T, U = never>(
  arbitraryBuilder: (extraParameters: U) => NextArbitrary<T>,
  isCorrect: (v: T, extraParameters: U, arb: NextArbitrary<T>) => void | boolean,
  options: {
    extraParameters?: fc.Arbitrary<U>;
    assertParameters?: fc.Parameters<unknown>;
  } = {}
): void {
  const { extraParameters: extra = fc.constant(undefined as unknown as U) as fc.Arbitrary<U>, assertParameters } =
    options;
  fc.assert(
    fc.property(
      fc.integer().noShrink(),
      biasFactorArbitrary(),
      fc.array(fc.nat(100), { minLength: 1 }),
      extra,
      (seed, biasFactor, shrinkPath, extraParameters) => {
        // Arrange
        const arb = arbitraryBuilder(extraParameters);

        // Act / Assert
        let g: NextValue<T> | null = arb.generate(randomFromSeed(seed), biasFactor);
        let id = 0;
        while (g !== null) {
          assertCorrectness(isCorrect, g.value, extraParameters, arb);
          g = arb.shrink(g.value, g.context).getNthOrLast(id);
          id = (id + 1) % shrinkPath.length;
        }
        expect(g).toBe(null);
      }
    ),
    assertParameters
  );
}

export function assertGenerateEquivalentTo<T, U = never>(
  arbitraryBuilderA: (extraParameters: U) => NextArbitrary<T>,
  arbitraryBuilderB: (extraParameters: U) => NextArbitrary<T>,
  options: {
    isEqual?: (v1: T, v2: T, extraParameters: U) => void | boolean;
    isEqualContext?: (c1: unknown, c2: unknown, extraParameters: U) => void | boolean;
    extraParameters?: fc.Arbitrary<U>;
    assertParameters?: fc.Parameters<unknown>;
  } = {}
): void {
  const {
    isEqual,
    isEqualContext,
    extraParameters: extra = fc.constant(undefined as unknown as U) as fc.Arbitrary<U>,
    assertParameters,
  } = options;
  fc.assert(
    fc.property(fc.integer().noShrink(), biasFactorArbitrary(), extra, (seed, biasFactor, extraParameters) => {
      // Arrange
      const arbA = arbitraryBuilderA(extraParameters);
      const arbB = arbitraryBuilderB(extraParameters);

      // Act
      const gA = arbA.generate(randomFromSeed(seed), biasFactor);
      const gB = arbB.generate(randomFromSeed(seed), biasFactor);

      // Assert
      assertEquality(isEqual, gA.value, gB.value, extraParameters);
      if (isEqualContext) {
        assertEquality(isEqualContext, gA.context, gB.context, extraParameters);
      }
    }),
    assertParameters
  );
}

// Extra requirements
// The assertions above can be configured to push generators even further. They ensure more complex invariants.
// Following assertions are mostly derived from the one above.
// > assertShrinkProducesSameValueGivenSameSeed with option {noInitialContext:true}
// > assertGenerateProducesCorrectValues with option isCorrect: (v, _, arb) => arb.canShrinkWithoutContext(v)
// > assertShrinkProducesCorrectValues with option (v, _, arb) => arb.canShrinkWithoutContext(v)

export function assertShrinkProducesSameValueWithoutInitialContext<T, U = never>(
  arbitraryBuilder: (extraParameters: U) => NextArbitrary<T>,
  options: {
    isEqual?: (v1: T, v2: T, extraParameters: U) => void | boolean;
    extraParameters?: fc.Arbitrary<U>;
    assertParameters?: fc.Parameters<unknown>;
  } = {}
): void {
  return assertProduceSameValueGivenSameSeed(arbitraryBuilder, { ...options, noInitialContext: true });
}

export function assertProduceValuesShrinkableWithoutContext<T, U = never>(
  arbitraryBuilder: (extraParameters: U) => NextArbitrary<T>,
  options: {
    extraParameters?: fc.Arbitrary<U>;
    assertParameters?: fc.Parameters<unknown>;
  } = {}
): void {
  return assertProduceCorrectValues(arbitraryBuilder, (v, _, arb) => arb.canShrinkWithoutContext(v), options);
}

export function assertShrinkProducesStrictlySmallerValue<T, U = never>(
  arbitraryBuilder: (extraParameters: U) => NextArbitrary<T>,
  isStrictlySmaller: (vNew: T, vOld: T, extraParameters: U) => void | boolean,
  options: {
    extraParameters?: fc.Arbitrary<U>;
    assertParameters?: fc.Parameters<unknown>;
  } = {}
): void {
  const previousValue: { value?: T } = {};
  function arbitraryBuilderInternal(...args: Parameters<typeof arbitraryBuilder>) {
    delete previousValue.value;
    return arbitraryBuilder(...args);
  }
  function isStrictlySmallerInternal(v: T, extraParameters: U) {
    try {
      if (!('value' in previousValue)) {
        return true;
      }
      const vNew = v;
      const vOld = previousValue.value!;
      try {
        const out = isStrictlySmaller(vNew, vOld, extraParameters);
        expect(out).not.toBe(false);
      } catch (err) {
        throw new Error(
          `Expect: ${fc.stringify(vNew)} to be strictly smaller than ${fc.stringify(vOld)}\n\nGot error: ${err}`
        );
      }
    } finally {
      previousValue.value = v;
    }
  }
  return assertProduceCorrectValues(arbitraryBuilderInternal, isStrictlySmallerInternal, options);
}

// Various helpers

function randomFromSeed(seed: number): Random {
  return new Random(prand.xorshift128plus(seed));
}

function biasFactorArbitrary() {
  return fc.option(fc.integer({ min: 2 }), { freq: 2, nil: undefined });
}

function assertEquality<T, U>(
  isEqual: ((v1: T, v2: T, extraParameters: U) => void | boolean) | undefined,
  v1: T,
  v2: T,
  extraParameters: U
): void {
  if (isEqual) {
    try {
      const out = isEqual(v1, v2, extraParameters);
      expect(out).not.toBe(false);
    } catch (err) {
      throw new Error(`Expect: ${fc.stringify(v1)} to be equal to ${fc.stringify(v2)}\n\nGot error: ${err}`);
    }
  } else expect(v1).toStrictEqual(v2);
}

function assertCorrectness<T, U>(
  isCorrect: (v: T, extraParameters: U, arb: NextArbitrary<T>) => void | boolean,
  v: T,
  extraParameters: U,
  arb: NextArbitrary<T>
): void {
  try {
    const out = isCorrect(v, extraParameters, arb);
    expect(out).not.toBe(false);
  } catch (err) {
    throw new Error(`Expect: ${fc.stringify(v)} to be a correct value\n\nGot error: ${err}`);
  }
}

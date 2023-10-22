import * as prand from 'pure-rand';
import * as fc from 'fast-check';
import { assertNoPoisoning, restoreGlobals } from '@fast-check/poisoning';

import { Arbitrary } from '../../../../src/check/arbitrary/definition/Arbitrary';
import { Value } from '../../../../src/check/arbitrary/definition/Value';
import { Random } from '../../../../src/random/generator/Random';
import { withConfiguredGlobal } from './GlobalSettingsHelpers';
import { sizeArb } from './SizeHelpers';

function poisoningAfterEach(nestedAfterEach: () => void) {
  nestedAfterEach();
  try {
    assertNoPoisoning({ ignoredRootRegex: /^(__coverage__|console)$/ });
  } catch (err) {
    restoreGlobals({ ignoredRootRegex: /^(__coverage__|console)$/ });
    throw err;
  }
}

type Checks<T, U> = {
  // Minimal requirements
  // > The following assertions are supposed to be fulfilled by any of the arbitraries
  // > provided by fast-check.
  sameValueGivenSameSeed: {
    isEqual?: (v1: T, v2: T, extraParameters: U) => void | boolean;
  };
  // Optional requirements
  // > The following requirements are optional as they do not break the design of fast-check when they are not totally ensured
  // > But some of them are really recommended to build valid arbitraries that can be used.
  correctValues?: {
    isCorrect: (v: T, extraParameters: U, arb: Arbitrary<T>) => void | boolean;
  };
  equivalentTo?: {
    otherArbitrary: (extraParameters: U) => Arbitrary<T>;
    isEqual?: (v1: T, v2: T, extraParameters: U) => void | boolean;
    isEqualContext?: (c1: unknown, c2: unknown, extraParameters: U) => void | boolean;
  };
  // Extra requirements
  // The assertions above can be configured to push generators even further. They ensure more complex invariants.
  // Following assertions are mostly derived from the one above.
  // > assertShrinkProducesSameValueGivenSameSeed with option {noInitialContext:true}
  // > assertGenerateProducesCorrectValues with option isCorrect: (v, _, arb) => arb.canShrinkWithoutContext(v)
  // > assertShrinkProducesCorrectValues with option (v, _, arb) => arb.canShrinkWithoutContext(v)
  sameValueWithoutInitialContext?: {
    isEqual?: (v1: T, v2: T, extraParameters: U) => void | boolean;
  };
  shrinkableWithoutContext?: Record<string, never>;
  strictlySmallerValue?: {
    isStrictlySmaller: (vNew: T, vOld: T, extraParameters: U) => void | boolean;
  };
};

export function assertValidArbitrary<T, U = never>(
  arbitraryBuilder: (extraParameters: U) => Arbitrary<T>,
  checks: Checks<T, U>,
  options: {
    extraParameters?: fc.Arbitrary<U>;
    assertParameters?: fc.Parameters<unknown>;
  } = {},
): void {
  const {
    sameValueGivenSameSeed,
    correctValues,
    equivalentTo,
    sameValueWithoutInitialContext,
    shrinkableWithoutContext,
    strictlySmallerValue,
  } = checks;
  const requiresG3 = sameValueWithoutInitialContext !== undefined;
  const requiresG4 = equivalentTo !== undefined;

  const { extraParameters: extra = fc.constant(undefined as unknown as U) as fc.Arbitrary<U>, assertParameters } =
    options;
  fc.assert(
    fc
      .property(
        fc.integer().noShrink(),
        biasFactorArbitrary(),
        fc.infiniteStream(fc.nat({ max: 20 })),
        extra,
        (seed, biasFactor, shrinkPath, extraParameters) => {
          // Arrange
          const previousValue: { value?: T } = {};
          const arb = arbitraryBuilder(extraParameters);

          // Act / Assert
          let g1: Value<T> | null = arb.generate(randomFromSeed(seed), biasFactor);
          let g2: Value<T> | null = arb.generate(randomFromSeed(seed), biasFactor);
          const tempG3 = requiresG3 ? arb.generate(randomFromSeed(seed), biasFactor) : null!;
          let g3: Value<T> | null = requiresG3 ? new Value(tempG3.value_, undefined, () => tempG3.value) : null;
          let g4: Value<T> | null = requiresG4
            ? equivalentTo!.otherArbitrary(extraParameters).generate(randomFromSeed(seed), biasFactor)
            : null;
          while (g1 !== null && g2 !== null) {
            // Extract relevant values
            const v1 = g1.value;
            const v2 = g2.value;
            const v3 = requiresG3 ? g3!.value : null!;
            const v4 = requiresG4 ? g4!.value : null!;
            // Perform each check
            assertEquality(sameValueGivenSameSeed.isEqual, v1, v2, extraParameters);
            if (correctValues !== undefined) {
              assertCorrectness(correctValues.isCorrect, v1, extraParameters, arb);
            }
            if (equivalentTo !== undefined) {
              assertEquality(equivalentTo.isEqual, v1, v4, extraParameters);
              if (equivalentTo.isEqualContext !== undefined) {
                assertEquality(equivalentTo.isEqualContext, v1, v4, extraParameters);
              }
            }
            if (sameValueWithoutInitialContext !== undefined) {
              assertEquality(sameValueWithoutInitialContext.isEqual, v1, v3, extraParameters);
            }
            if (shrinkableWithoutContext !== undefined) {
              assertCorrectness((v, _, arb) => arb.canShrinkWithoutContext(v), v1, extraParameters, arb);
            }
            if (strictlySmallerValue) {
              // eslint-disable-next-line no-inner-declarations
              function isStrictlySmallerInternal(v: T, extraParameters: U) {
                try {
                  if (!('value' in previousValue)) {
                    return true;
                  }
                  const vNew = v;
                  const vOld = previousValue.value!;
                  try {
                    const out = strictlySmallerValue!.isStrictlySmaller(vNew, vOld, extraParameters);
                    expect(out).not.toBe(false);
                  } catch (err) {
                    throw new Error(
                      `Expect: ${fc.stringify(vNew)} to be strictly smaller than ${fc.stringify(
                        vOld,
                      )}\n\nGot error: ${err}`,
                    );
                  }
                } finally {
                  previousValue.value = v;
                }
              }
              assertCorrectness(isStrictlySmallerInternal, v1, extraParameters, arb);
            }

            const pos = shrinkPath.next().value;
            g1 = arb.shrink(g1.value_, g1.context).getNthOrLast(pos);
            g2 = arb.shrink(g2.value_, g2.context).getNthOrLast(pos);
            g3 = requiresG3 ? arb.shrink(g3!.value_, g3!.context).getNthOrLast(pos) : null;
            g4 = requiresG4 ? arb.shrink(g4!.value_, g4!.context).getNthOrLast(pos) : null;
          }
          expect(g1).toBe(null);
          expect(g2).toBe(null);
          expect(g3).toBe(null);
          expect(g4).toBe(null);
        },
      )
      .afterEach(poisoningAfterEach),
    assertParameters,
  );
}

// Extra requirements
// The assertions above can be configured to push generators even further. They ensure more complex invariants.
// Following assertions are mostly derived from the one above.
// > assertShrinkProducesSameValueGivenSameSeed with option {noInitialContext:true}
// > assertGenerateProducesCorrectValues with option isCorrect: (v, _, arb) => arb.canShrinkWithoutContext(v)
// > assertShrinkProducesCorrectValues with option (v, _, arb) => arb.canShrinkWithoutContext(v)

export function assertProduceSomeSpecificValues<T, U = never>(
  arbitraryBuilder: (extraParameters: U) => Arbitrary<T>,
  isSpecificValue: (value: T) => boolean,
  options: {
    extraParameters?: fc.Arbitrary<U>;
    assertParameters?: fc.Parameters<unknown>;
  } = {},
): void {
  let foundOne = false;
  function detectSpecificValue(value: T): boolean {
    if (isSpecificValue(value)) {
      foundOne = true;
      return false; // failure of the property
    }
    return true; // success of the property
  }
  try {
    assertValidArbitrary(
      arbitraryBuilder,
      {
        sameValueGivenSameSeed: { isEqual: () => true }, // check ignored
        correctValues: { isCorrect: detectSpecificValue },
      },
      {
        ...options,
        // We default numRuns to 1000, but let user override it whenever needed
        assertParameters: { numRuns: 1000, ...options.assertParameters, endOnFailure: true },
      },
    );
  } catch (err) {
    // no-op
  }
  expect(foundOne).toBe(true);
}

export function assertGenerateIndependentOfSize<T, U = never>(
  arbitraryBuilder: (extraParameters: U) => Arbitrary<T>,
  options: {
    isEqual?: (v1: T, v2: T, extraParameters: U) => void | boolean;
    isEqualContext?: (c1: unknown, c2: unknown, extraParameters: U) => void | boolean;
    extraParameters?: fc.Arbitrary<U>;
    assertParameters?: fc.Parameters<unknown>;
  } = {},
): void {
  const {
    extraParameters = fc.constant(undefined as unknown as U) as fc.Arbitrary<U>,
    isEqual,
    isEqualContext,
    assertParameters,
  } = options;
  assertValidArbitrary(
    (extra) => arbitraryBuilder(extra.requested),
    {
      sameValueGivenSameSeed: { isEqual: () => true }, // check ignored
      equivalentTo: {
        otherArbitrary: (extra) => withConfiguredGlobal(extra.global, () => arbitraryBuilder(extra.requested)),
        isEqual: isEqual !== undefined ? (a, b, extra) => isEqual(a, b, extra.requested) : undefined,
        isEqualContext:
          isEqualContext !== undefined ? (a, b, extra) => isEqualContext(a, b, extra.requested) : undefined,
      },
    },
    {
      extraParameters: fc.record({
        requested: extraParameters,
        global: fc.record({ defaultSizeToMaxWhenMaxSpecified: fc.boolean(), baseSize: sizeArb }, { requiredKeys: [] }),
      }),
      assertParameters,
    },
  );
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
  extraParameters: U,
): void {
  try {
    if (isEqual) {
      const out = isEqual(v1, v2, extraParameters);
      expect(out).not.toBe(false);
    } else {
      expect(v1).toStrictEqual(v2);
    }
  } catch (err) {
    throw new Error(`Expect: ${fc.stringify(v1)} to be equal to ${fc.stringify(v2)}\n\nGot error: ${err}`);
  }
}

function assertCorrectness<T, U>(
  isCorrect: (v: T, extraParameters: U, arb: Arbitrary<T>) => void | boolean,
  v: T,
  extraParameters: U,
  arb: Arbitrary<T>,
): void {
  try {
    const out = isCorrect(v, extraParameters, arb);
    expect(out).not.toBe(false);
  } catch (err) {
    throw new Error(`Expect: ${fc.stringify(v)} to be a correct value\n\nGot error: ${err}`);
  }
}

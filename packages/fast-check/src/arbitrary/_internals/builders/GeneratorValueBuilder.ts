import type { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary.js';
import { Value } from '../../../check/arbitrary/definition/Value.js';
import { cloneMethod } from '../../../check/symbols.js';
import type { Random } from '../../../random/generator/Random.js';
import { safeMap, safePush } from '../../../utils/globals.js';
import { stringify, toStringMethod } from '../../../utils/stringify.js';
import type { ArbitraryGeneratorCache } from './StableArbitraryGeneratorCache.js';

export type InternalGeneratorValueFunction = <T>(arb: Arbitrary<T>) => T;

const safeObjectAssign = Object.assign;

/**
 * Take an arbitrary builder and all its arguments separatly.
 * Generate a value out of it.
 *
 * @remarks Since 3.8.0
 * @public
 */
export type GeneratorValueFunction = <T, TArgs extends unknown[]>(
  arb: (...params: TArgs) => Arbitrary<T>,
  ...args: TArgs
) => T;

/**
 * The values part is mostly exposed for the purpose of the tests.
 * Or if you want to have a custom error formatter for this kind of values.
 *
 * @remarks Since 3.8.0
 * @public
 */
export type GeneratorValueMethods = { values: () => unknown[] };

/**
 * An instance of {@link GeneratorValue} can be leveraged within predicates themselves to produce extra random values
 * while preserving part of the shrinking capabilities on the produced values.
 *
 * It can be seen as a way to start property based testing within something looking closer from what users will
 * think about when thinking about random in tests. But contrary to raw random, it comes with many useful strengths
 * such as: ability to re-run the test (seeded), shrinking...
 *
 * @remarks Since 3.8.0
 * @public
 */
export type GeneratorValue = GeneratorValueFunction & GeneratorValueMethods;

/**
 * Details related to pre-built values
 * @internal
 */
export type PreBuiltValue = {
  /** The arbitrary used to generate the value */
  arb: Arbitrary<unknown>;
  /** The generated value */
  value: unknown;
  /** The attached context */
  context: unknown;
  /** The attached Random */
  mrng: Random;
};

/**
 * Context attached next to {@link GeneratorValue}
 * @internal
 */
export type GeneratorContext = {
  /** Cloned version of the random number generator */
  mrng: Random;
  /** Specified bias factor to be applied */
  biasFactor: number | undefined;
  /** History related data to be able to shrink back values */
  history: PreBuiltValue[];
};

/**
 * An internal builder of values of type {@link GeneratorValue}
 * @internal
 */
export function buildGeneratorValue(
  mrng: Random,
  biasFactor: number | undefined,
  computePreBuiltValues: () => PreBuiltValue[],
  arbitraryCache: ArbitraryGeneratorCache,
): Value<GeneratorValue> {
  const preBuiltValues = computePreBuiltValues();
  let localMrng = mrng.clone();
  const context: GeneratorContext = { mrng: mrng.clone(), biasFactor, history: [] };

  const valueFunction: InternalGeneratorValueFunction = <T>(arb: Arbitrary<T>): T => {
    // We pull values from our pre-built values until we reach mismatching ones
    const preBuiltValue = preBuiltValues[context.history.length];
    if (preBuiltValue !== undefined && preBuiltValue.arb === arb) {
      // Until it matches we just re-use the originally produced value
      const value = preBuiltValue.value;
      safePush(context.history, { arb, value, context: preBuiltValue.context, mrng: preBuiltValue.mrng });
      localMrng = preBuiltValue.mrng.clone();
      return value as T;
    }
    // While tempting, one should not "Forbid users to diverge on the first generated value" or any other values
    // Actually it's legit case when the value is used in conjunction with other arbitraries as each will be shrunk separately
    // possibly leading from totally different sets of functions.
    // In other words: `preBuiltValue !== undefined && context.history.length === 0` is a legit case!
    // If we start to mismatch we run a new random value computation
    const g = arb.generate(localMrng, biasFactor);
    safePush(context.history, { arb, value: g.value_, context: g.context, mrng: localMrng.clone() });
    return g.value;
  };

  const memoedValueFunction: GeneratorValueFunction = <T, TArgs extends unknown[]>(
    arb: (...params: TArgs) => Arbitrary<T>,
    ...args: TArgs
  ) => {
    return valueFunction(arbitraryCache(arb, args));
  };

  const valueMethods = {
    values(): unknown[] {
      return safeMap(context.history, (c) => c.value);
    },
    [cloneMethod](): GeneratorValue {
      return buildGeneratorValue(mrng, biasFactor, computePreBuiltValues, arbitraryCache).value;
    },
    [toStringMethod](): string {
      return stringify(safeMap(context.history, (c) => c.value));
    },
  };

  const value = safeObjectAssign(memoedValueFunction, valueMethods);
  return new Value(value, context);
}

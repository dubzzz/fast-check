import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../../check/arbitrary/definition/Value';
import { cloneMethod } from '../../../check/symbols';
import { Random } from '../../../random/generator/Random';
import { stringify, toStringMethod } from '../../../utils/stringify';

export type InternalGeneratorValueFunction = <T>(arb: Arbitrary<T>) => T;
export type GeneratorValueFunction = <T, TArgs extends unknown[]>(
  arb: (...params: TArgs) => Arbitrary<T>,
  ...args: TArgs
) => T;
export type GeneratorValueMethods = { values: () => unknown[] };

/**
 * An instance of {@link GeneratorValue} can be leveraged within predicates themselves to produce extra random values
 * while preserving part of the shrinking capabilities on the produced values.
 *
 * It can be seen as a way to start property based testing within something looking closer from what users will
 * think about when thinking about random in tests. But contrary to raw random, it comes with many useful strengths
 * such as: ability to re-run the test (seeded), shrinking...
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
  isEqual: (v1: unknown, v2: unknown) => boolean
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
      context.history.push({ arb, value, context: preBuiltValue.context, mrng: preBuiltValue.mrng });
      localMrng = preBuiltValue.mrng.clone();
      return value as T;
    }
    // Forbid users to diverge on the first generated value
    if (preBuiltValue !== undefined && context.history.length === 0) {
      throw new Error(
        `Illegal use of fc.auto: ` +
          `passed arbitraries can only vary between calls based on generated values not on external world`
      );
    }
    // If we start to mismatch we run a new random value computation
    const g = arb.generate(localMrng, biasFactor);
    context.history.push({ arb, value: g.value_, context: g.context, mrng: localMrng.clone() });
    return g.value;
  };

  const previousCallsPerBuilder = new WeakMap<
    () => Arbitrary<unknown>,
    { params: unknown[]; value: Arbitrary<unknown> }[]
  >();
  const memoedExtractor = <T, TArgs extends unknown[]>(
    arb: (...params: TArgs) => Arbitrary<T>,
    ...args: TArgs
  ): Arbitrary<T> => {
    const entriesForBuilder = previousCallsPerBuilder.get(arb);
    if (entriesForBuilder === undefined) {
      const newValue = arb(...args);
      previousCallsPerBuilder.set(arb, [{ params: args, value: newValue }]);
      return newValue;
    }
    const safeEntriesForBuilder = entriesForBuilder as { params: unknown[]; value: Arbitrary<T> }[];
    for (const entry of safeEntriesForBuilder) {
      if (isEqual(args, entry.params)) {
        return entry.value;
      }
    }
    const newValue = arb(...args);
    safeEntriesForBuilder.push({ params: args, value: newValue });
    return newValue;
  };
  const memoedValueFunction: GeneratorValueFunction = <T, TArgs extends unknown[]>(
    arb: (...params: TArgs) => Arbitrary<T>,
    ...args: TArgs
  ) => {
    return valueFunction(memoedExtractor(arb, ...args));
  };

  const valueMethods = {
    values(): unknown[] {
      return context.history.map((c) => c.value);
    },
    [cloneMethod](): GeneratorValue {
      return buildGeneratorValue(mrng, biasFactor, computePreBuiltValues, isEqual).value;
    },
    [toStringMethod](): string {
      return stringify(context.history.map((c) => c.value));
    },
  };

  const value = Object.assign(memoedValueFunction, valueMethods);
  return new Value(value, context);
}

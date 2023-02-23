import { Arbitrary } from '../../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../../check/arbitrary/definition/Value';
import { cloneMethod } from '../../../check/symbols';
import { Random } from '../../../random/generator/Random';
import { stringify, toStringMethod } from '../../../utils/stringify';

export type AutoValueFunction = <T>(arb: Arbitrary<T>) => T;
export type AutoValueMethods = { values: () => unknown[] };
export type AutoValue = AutoValueFunction & AutoValueMethods;

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
};

/**
 * Context attached next to AutoValue
 * @internal
 */
export type AutoContext = {
  /** Cloned version of the random number generator */
  mrng: Random;
  /** Specified bias factor to be applied */
  biasFactor: number | undefined;
  /** History related data to be able to shrink back values */
  history: PreBuiltValue[];
};

/**
 * An internal builder of values of type AutoValue
 * @internal
 */
export function buildAutoValue(
  mrng: Random,
  biasFactor: number | undefined,
  computePreBuiltValues: () => PreBuiltValue[]
): Value<AutoValue> {
  const preBuiltValues = computePreBuiltValues();
  const localMrng = mrng.clone();
  const context: AutoContext = { mrng: mrng.clone(), biasFactor, history: [] };

  const valueFunction: AutoValueFunction = <T>(arb: Arbitrary<T>): T => {
    const preBuiltValue = preBuiltValues[context.history.length];
    if (preBuiltValue !== undefined && preBuiltValue.arb === arb) {
      const value = preBuiltValue.value;
      context.history.push({ arb, value, context: preBuiltValue.context });
      return value as T;
    }
    if (preBuiltValue !== undefined && context.history.length === 0) {
      throw new Error(
        `Illegal use of fc.auto: ` +
          `passed arbitraries can only vary between calls based on generated values not on external world`
      );
    }
    const g = arb.generate(localMrng, biasFactor);
    context.history.push({ arb, value: g.value_, context: g.context });
    return g.value;
  };

  const valueMethods = {
    values(): unknown[] {
      return context.history.map((c) => c.value);
    },
    [cloneMethod](): AutoValue {
      return buildAutoValue(mrng, biasFactor, computePreBuiltValues).value;
    },
    [toStringMethod](): string {
      return stringify(context.history.map((c) => c.value));
    },
  };

  const value = Object.assign(valueFunction, valueMethods);
  return new Value(value, context);
}

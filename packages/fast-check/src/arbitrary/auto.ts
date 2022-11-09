import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { Value } from '../check/arbitrary/definition/Value';
import { cloneMethod } from '../check/symbols';
import { Random } from '../random/generator/Random';
import { Stream } from '../stream/Stream';
import { stringify, toStringMethod } from '../utils/stringify';
import { tupleShrink } from './_internals/TupleArbitrary';

type AutoContext = {
  mrng: Random;
  biasFactor: number | undefined;
  history: {
    arb: Arbitrary<unknown>;
    value: unknown;
    context: unknown;
  }[];
};

export type AutoValueFunction = <T>(arb: Arbitrary<T>) => T;
export type AutoValueMethods = { values: () => unknown[] };
export type AutoValue = AutoValueFunction & AutoValueMethods;

type PreBuiltValue = { arb: Arbitrary<unknown>; value: unknown; context: unknown };
function buildAutoValue(
  mrng: Random,
  biasFactor: number | undefined,
  computePreBuiltValues: () => PreBuiltValue[]
): Value<AutoValue> {
  const preBuiltValues = computePreBuiltValues();
  const clonedMrng = mrng.clone();
  const context: AutoContext = { mrng: clonedMrng, biasFactor, history: [] };
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
    const g = arb.generate(clonedMrng, biasFactor);
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

class AutoArbitrary extends Arbitrary<AutoValue> {
  generate(mrng: Random, biasFactor: number | undefined): Value<AutoValue> {
    return buildAutoValue(mrng.clone(), biasFactor, () => []);
  }
  canShrinkWithoutContext(value: unknown): value is AutoValue {
    return false;
  }
  shrink(_value: AutoValue, context: unknown): Stream<Value<AutoValue>> {
    if (context === undefined) {
      return Stream.nil();
    }
    const safeContext = context as AutoContext;
    const mrng = safeContext.mrng;
    const biasFactor = safeContext.biasFactor;
    const history = safeContext.history;
    return tupleShrink(
      history.map((c) => c.arb),
      history.map((c) => c.value),
      history.map((c) => c.context)
    ).map((shrink): Value<AutoValue> => {
      function computePreBuiltValues(): PreBuiltValue[] {
        const subValues = shrink.value; // trigger an explicit access to the value in case it needs to be cloned
        const subContexts = shrink.context;
        return history.map((entry, index) => ({
          arb: entry.arb,
          value: subValues[index],
          context: subContexts[index],
        }));
      }
      return buildAutoValue(mrng, biasFactor, computePreBuiltValues);
    });
  }
}

export function auto(): Arbitrary<AutoValue> {
  return new AutoArbitrary();
}

import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { Random, Value, Stream } from '../fast-check-default';
import { stringify, toStringMethod, WithToStringMethod } from '../utils/stringify';
import { TupleArbitrary } from './_internals/TupleArbitrary';

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
  preBuiltValues: PreBuiltValue[]
): Value<AutoValue> {
  const clonedMrng = mrng.clone();
  const context: AutoContext = { mrng: clonedMrng, biasFactor, history: [] };
  const valueFunction: AutoValueFunction = <T>(arb: Arbitrary<T>): T => {
    const preBuiltValue = preBuiltValues[context.history.length];
    if (preBuiltValue !== undefined && preBuiltValue.arb === arb) {
      const value = preBuiltValue.value;
      context.history.push({ arb, value, context: preBuiltValue.context });
      return value as T;
    }
    const g = arb.generate(clonedMrng, biasFactor);
    context.history.push({ arb, value: g.value_, context: g.context });
    return g.value;
  };
  const valueMethods: AutoValueMethods & WithToStringMethod = {
    values() {
      return context.history.map((c) => c.value);
    },
    [toStringMethod]() {
      return stringify(context.history.map((c) => c.value));
    },
  };
  const value = Object.assign(valueFunction, valueMethods);
  return new Value(value, context);
}

class AutoArbitrary extends Arbitrary<AutoValue> {
  generate(mrng: Random, biasFactor: number | undefined): Value<AutoValue> {
    return buildAutoValue(mrng, biasFactor, []);
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
    const tupleArb = new TupleArbitrary(history.map((c) => c.arb));
    return tupleArb
      .shrink(
        history.map((c) => c.value),
        history.map((c) => c.context) // HACKY!!!
      )
      .map((shrink): Value<AutoValue> => {
        if (
          shrink.value_.length !== history.length ||
          !Array.isArray(shrink.context) ||
          shrink.context.length !== history.length
        ) {
          return buildAutoValue(mrng, biasFactor, []);
        }
        const shrinkContext = shrink.context;
        const preBuiltValues: PreBuiltValue[] = safeContext.history.map((entry, index) => ({
          arb: entry.arb,
          value: shrink.value_[index],
          context: shrinkContext[index], // HACKY!!!
        }));
        return buildAutoValue(mrng, biasFactor, preBuiltValues);
      });
  }
}

export function auto(): Arbitrary<AutoValue> {
  return new AutoArbitrary();
}

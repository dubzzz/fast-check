import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { Random, Value, Stream } from '../fast-check-default';
import { stringify, toStringMethod, WithToStringMethod } from '../utils/stringify';
import { TupleArbitrary } from './_internals/TupleArbitrary';

type AutoContext = {
  mrng: Random;
  biasFactor: number | undefined;
  history: {
    arbBuilder: () => Arbitrary<unknown>;
    args: unknown[];
    arb: Arbitrary<unknown>;
    value: unknown;
    context: unknown;
  }[];
};

function isEqual(v1: unknown, v2: unknown): boolean {
  if (Object.is(v1, v2)) {
    return true;
  }
  if (v1 === null || v2 === null) {
    return false;
  }
  if (typeof v1 !== 'object' || typeof v2 !== 'object') {
    return false;
  }
  if (Array.isArray(v1) && Array.isArray(v2)) {
    if (v1.length !== v2.length) {
      return false;
    }
    return v1.every((item, index) => isEqual(item, v2[index]));
  }
  // HACKY!!! Do not work
  return isEqual(Object.entries(v1), Object.entries(v2));
}

export type AutoValue = {
  builder: <T, TArgs extends unknown[]>(arbBuilder: (...args: TArgs) => Arbitrary<T>, ...args: TArgs) => T;
  values: () => unknown[];
};

class AutoArbitrary extends Arbitrary<AutoValue> {
  generate(mrng: Random, biasFactor: number | undefined): Value<AutoValue> {
    const clonedMrng = mrng.clone();
    const context: AutoContext = { mrng: clonedMrng, biasFactor, history: [] };
    const value: AutoValue & WithToStringMethod = {
      builder: (arbBuilder, ...args) => {
        const arb = arbBuilder(...args);
        const g = arb.generate(clonedMrng, biasFactor);
        context.history.push({ arbBuilder, args, arb, value: g.value_, context: g.context });
        return g.value;
      },
      values: () => context.history.map((c) => c.value),
      [toStringMethod]: () => {
        return stringify(context.history.map((c) => c.value));
      },
    };
    return new Value(value, context);
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
    const tupleArb = new TupleArbitrary(safeContext.history.map((c) => c.arb));
    return tupleArb
      .shrink(
        safeContext.history.map((c) => c.value),
        safeContext.history.map((c) => c.context) // HACKY!!!
      )
      .map((shrink): Value<AutoValue> => {
        const clonedMrng = mrng.clone();
        const newContext: AutoContext = { mrng: clonedMrng, biasFactor, history: [] };
        const newValue: AutoValue & WithToStringMethod = {
          builder: <T, TArgs extends unknown[]>(arbBuilder: (...args: TArgs) => Arbitrary<T>, ...args: TArgs): T => {
            const fromOldContext = safeContext.history[newContext.history.length];
            if (
              fromOldContext !== undefined &&
              fromOldContext.arbBuilder === arbBuilder &&
              isEqual(fromOldContext.args, args)
            ) {
              const value = shrink.value_[newContext.history.length];
              const context = (shrink.context as unknown[])[newContext.history.length]; // HACKY!!!
              newContext.history.push({ arbBuilder, args, arb: fromOldContext.arb, value, context });
              return value as T;
            }
            const arb = arbBuilder(...args);
            const g = arb.generate(clonedMrng, biasFactor);
            newContext.history.push({ arbBuilder, args, arb, value: g.value_, context: g.context });
            return g.value;
          },
          values: () => newContext.history.map((c) => c.value),
          [toStringMethod]: () => {
            return stringify(newContext.history.map((c) => c.value));
          },
        };
        return new Value(newValue, newContext);
      });
  }
}

export function auto(): Arbitrary<AutoValue> {
  return new AutoArbitrary();
}

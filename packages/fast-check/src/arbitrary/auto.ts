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

export type AutoValue = {
  builder: <T>(arb: Arbitrary<T>) => T;
  values: () => unknown[];
};

class AutoArbitrary extends Arbitrary<AutoValue> {
  generate(mrng: Random, biasFactor: number | undefined): Value<AutoValue> {
    const clonedMrng = mrng.clone();
    const context: AutoContext = { mrng: clonedMrng, biasFactor, history: [] };
    const value: AutoValue & WithToStringMethod = {
      builder: (arb) => {
        const g = arb.generate(clonedMrng, biasFactor);
        context.history.push({ arb, value: g.value_, context: g.context });
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
          builder: <T>(arb: Arbitrary<T>): T => {
            const fromOldContext = safeContext.history[newContext.history.length];
            if (fromOldContext !== undefined && fromOldContext.arb === arb) {
              const value = shrink.value_[newContext.history.length];
              const context = (shrink.context as unknown[])[newContext.history.length]; // HACKY!!!
              newContext.history.push({ arb, value, context });
              return value as T;
            }
            const g = arb.generate(clonedMrng, biasFactor);
            newContext.history.push({ arb, value: g.value_, context: g.context });
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

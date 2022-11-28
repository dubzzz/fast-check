import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { cloneIfNeeded, cloneMethod, WithCloneMethod } from '../../check/symbols';
import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import { safeMap, safePush, safeSlice } from '../../utils/globals';
import { makeLazy } from '../../stream/LazyIterableIterator';

const safeArrayIsArray = Array.isArray;
const safeObjectDefineProperty = Object.defineProperty;

/** @internal */
type TupleContext = unknown[];
/** @internal */
type TupleExtendedValue<Ts> = Value<Ts> & { context: TupleContext };

/** @internal */
function tupleMakeItCloneable<TValue>(vs: TValue[], values: Value<TValue>[]): WithCloneMethod<TValue[]> {
  return safeObjectDefineProperty(vs, cloneMethod, {
    value: () => {
      const cloned: TValue[] = [];
      for (let idx = 0; idx !== values.length; ++idx) {
        safePush(cloned, values[idx].value); // push potentially cloned values
      }
      tupleMakeItCloneable(cloned, values);
      return cloned;
    },
  }) as unknown as WithCloneMethod<TValue[]>;
}

/** @internal */
function tupleWrapper<Ts extends unknown[]>(values: ValuesArray<Ts>): TupleExtendedValue<Ts> {
  let cloneable = false;
  const vs = [] as unknown as Ts & unknown[];
  const ctxs: TupleContext = [];
  for (let idx = 0; idx !== values.length; ++idx) {
    const v = values[idx];
    cloneable = cloneable || v.hasToBeCloned;
    safePush(vs, v.value);
    safePush(ctxs, v.context);
  }
  if (cloneable) {
    tupleMakeItCloneable(vs, values);
  }
  return new Value(vs, ctxs) as TupleExtendedValue<Ts>;
}

/** @internal */
export function tupleShrink<Ts extends unknown[]>(
  arbs: ArbsArray<Ts>,
  value: Ts,
  context?: TupleContext
): Stream<TupleExtendedValue<Ts>> {
  // shrinking one by one is the not the most comprehensive
  // but allows a reasonable number of entries in the shrink
  let s = Stream.nil<TupleExtendedValue<Ts>>();
  const safeContext: TupleContext = safeArrayIsArray(context) ? context : [];
  for (let idx = 0; idx !== arbs.length; ++idx) {
    s = s.join(
      makeLazy(() =>
        arbs[idx]
          .shrink(value[idx], safeContext[idx])
          .map((v) => {
            const nextValues: Value<unknown>[] = safeMap(
              value,
              (v, idx) => new Value(cloneIfNeeded(v), safeContext[idx])
            );
            return [...safeSlice(nextValues, 0, idx), v, ...safeSlice(nextValues, idx + 1)];
          })
          .map((values) => tupleWrapper(values) as TupleExtendedValue<Ts>)
      )
    );
  }
  return s;
}

/** @internal */
type ArbsArray<Ts extends unknown[]> = { [K in keyof Ts]: Arbitrary<Ts[K]> };
/** @internal */
type ValuesArray<Ts extends unknown[]> = { [K in keyof Ts]: Value<Ts[K]> };

/** @internal */
export class TupleArbitrary<Ts extends unknown[]> extends Arbitrary<Ts> {
  constructor(readonly arbs: ArbsArray<Ts>) {
    super();
    for (let idx = 0; idx !== arbs.length; ++idx) {
      const arb = arbs[idx];
      if (arb == null || arb.generate == null)
        throw new Error(`Invalid parameter encountered at index ${idx}: expecting an Arbitrary`);
    }
  }
  generate(mrng: Random, biasFactor: number | undefined): Value<Ts> {
    return tupleWrapper<Ts>(safeMap(this.arbs, (a) => a.generate(mrng, biasFactor)) as ValuesArray<Ts>);
  }
  canShrinkWithoutContext(value: unknown): value is Ts {
    if (!safeArrayIsArray(value) || value.length !== this.arbs.length) {
      return false;
    }
    for (let index = 0; index !== this.arbs.length; ++index) {
      if (!this.arbs[index].canShrinkWithoutContext(value[index])) {
        return false;
      }
    }
    return true;
  }
  shrink(value: Ts, context?: unknown): Stream<Value<Ts>> {
    return tupleShrink(this.arbs, value, context as TupleContext | undefined);
  }
}

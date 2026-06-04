import type { Random } from '../../random/generator/Random.js';
import { Stream } from '../../stream/Stream.js';
import type { WithCloneMethod } from '../../check/symbols.js';
import { cloneIfNeeded, cloneMethod } from '../../check/symbols.js';
import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import { Value } from '../../check/arbitrary/definition/Value.js';
import { safePush } from '../../utils/globals.js';
import { makeLazy } from '../../stream/LazyIterableIterator.js';

const safeArrayIsArray = Array.isArray;
const safeObjectDefineProperty = Object.defineProperty;

/** @internal */
type TupleContext = unknown[];
/** @internal */
type TupleExtendedValue<Ts> = Value<Ts> & { context: TupleContext };

/** @internal */
function tupleMakeItCloneable<TValue>(
  vs: TValue[],
  ctxs: TupleContext,
  values: (Value<TValue> | undefined)[],
): WithCloneMethod<TValue[]> {
  return safeObjectDefineProperty(vs, cloneMethod, {
    value: () => {
      const cloned: TValue[] = [];
      for (let idx = 0; idx !== values.length; ++idx) {
        let current = values[idx];
        if (current === undefined) {
          current = new Value(vs[idx], ctxs[idx]); // backfill missing indices in values. Each missing idx is simply a dummy Value instance
        }
        safePush(cloned, current.value); // push potentially cloned values
      }
      tupleMakeItCloneable(cloned, ctxs, values);
      return cloned;
    },
  }) as unknown as WithCloneMethod<TValue[]>;
}

/** @internal */
export function tupleShrink<Ts extends unknown[]>(
  arbs: ArbsArray<Ts>,
  value: Ts,
  context?: TupleContext,
): Stream<TupleExtendedValue<Ts>> {
  // shrinking one by one is the not the most comprehensive
  // but allows a reasonable number of entries in the shrink
  const shrinks: IterableIterator<TupleExtendedValue<Ts>>[] = [];
  const safeContext: TupleContext = safeArrayIsArray(context) ? context : [];
  for (let idx = 0; idx !== arbs.length; ++idx) {
    safePush(
      shrinks,
      makeLazy(() =>
        arbs[idx].shrink(value[idx], safeContext[idx]).map((v) => {
          let cloneable = false;
          const vs = [] as unknown as Ts & unknown[];
          const ctxs: TupleContext = [];
          const mapped = [] as ValuesArray<Ts>; // WARNING: Holey array
          for (let nestedIdx = 0; nestedIdx !== arbs.length; ++nestedIdx) {
            const nestedV = nestedIdx === idx ? v : new Value(cloneIfNeeded(value[idx]), safeContext[idx]);
            if (nestedV.hasToBeCloned) {
              cloneable = true;
              mapped[nestedIdx] = nestedV;
            }
            safePush(vs, nestedV.value);
            safePush(ctxs, nestedV.context);
          }
          if (cloneable) {
            tupleMakeItCloneable(vs, ctxs, mapped);
          }
          return new Value(vs, ctxs) as TupleExtendedValue<Ts>;
        }),
      ),
    );
  }
  return Stream.nil<TupleExtendedValue<Ts>>().join(...shrinks);
}

/** @internal */
type ArbsArray<Ts extends unknown[]> = { [K in keyof Ts]: Arbitrary<Ts[K]> };
/** @internal */
type ValuesArray<Ts extends unknown[]> = { [K in keyof Ts]?: Value<Ts[K]> };

/** @internal */
export class TupleArbitrary<Ts extends unknown[]> extends Arbitrary<Ts> {
  constructor(readonly arbs: ArbsArray<Ts>) {
    super();
    for (let idx = 0; idx !== arbs.length; ++idx) {
      const arb = arbs[idx];
      if (arb === null || arb === undefined || arb.generate === null || arb.generate === undefined)
        throw new Error(`Invalid parameter encountered at index ${idx}: expecting an Arbitrary`);
    }
  }
  generate(mrng: Random, biasFactor: number | undefined): Value<Ts> {
    let cloneable = false;
    const vs = [] as unknown as Ts & unknown[];
    const ctxs: TupleContext = [];
    const mapped = [] as ValuesArray<Ts>; // WARNING: Holey array
    for (let idx = 0; idx !== this.arbs.length; ++idx) {
      const v = this.arbs[idx].generate(mrng, biasFactor);
      if (v.hasToBeCloned) {
        cloneable = true;
        mapped[idx] = v;
      }
      safePush(vs, v.value);
      safePush(ctxs, v.context);
    }
    if (cloneable) {
      tupleMakeItCloneable(vs, ctxs, mapped);
    }
    return new Value(vs, ctxs) as TupleExtendedValue<Ts>;
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

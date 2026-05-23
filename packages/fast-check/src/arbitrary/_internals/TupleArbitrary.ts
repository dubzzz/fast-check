import type { Random } from '../../random/generator/Random.js';
import { Stream } from '../../stream/Stream.js';
import type { WithCloneMethod } from '../../check/symbols.js';
import { cloneIfNeeded, cloneMethod } from '../../check/symbols.js';
import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import { Value } from '../../check/arbitrary/definition/Value.js';
import { makeLazy } from '../../stream/LazyIterableIterator.js';

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
      const len = values.length;
      // oxlint-disable-next-line unicorn/no-new-array
      const cloned: TValue[] = new Array(len);
      for (let idx = 0; idx !== len; ++idx) {
        cloned[idx] = values[idx].value; // potentially cloned values
      }
      tupleMakeItCloneable(cloned, values);
      return cloned;
    },
  }) as unknown as WithCloneMethod<TValue[]>;
}

/** @internal */
function tupleWrapper<Ts extends unknown[]>(values: ValuesArray<Ts>): TupleExtendedValue<Ts> {
  const len = values.length;
  // oxlint-disable-next-line unicorn/no-new-array
  const vs = new Array(len) as Ts & unknown[];
  // oxlint-disable-next-line unicorn/no-new-array
  const ctxs: TupleContext = new Array(len);
  let cloneable = false;
  for (let idx = 0; idx !== len; ++idx) {
    const v = values[idx];
    vs[idx] = v.value;
    ctxs[idx] = v.context;
    cloneable = cloneable || v.hasToBeCloned;
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
  context?: TupleContext,
): Stream<TupleExtendedValue<Ts>> {
  // shrinking one by one is the not the most comprehensive
  // but allows a reasonable number of entries in the shrink
  const len = arbs.length;
  // oxlint-disable-next-line unicorn/no-new-array
  const shrinks: IterableIterator<TupleExtendedValue<Ts>>[] = new Array(len);
  const safeContext: TupleContext = safeArrayIsArray(context) ? context : [];
  for (let idx = 0; idx !== len; ++idx) {
    const localIdx = idx;
    shrinks[idx] = makeLazy(() =>
      arbs[localIdx]
        .shrink(value[localIdx], safeContext[localIdx])
        .map((v) => {
          // Build the resulting Value<unknown>[] in one pass: copy `value` wrapped in Value,
          // and swap in the freshly-shrunk `v` at position `localIdx`.
          // We deliberately still call cloneIfNeeded on value[localIdx] to preserve the original
          // behaviour where every position triggers a clone of any cloneable element, even though
          // the cloned result at position `localIdx` is discarded.
          cloneIfNeeded(value[localIdx]);
          // oxlint-disable-next-line unicorn/no-new-array
          const nextValues = new Array(len) as ValuesArray<Ts>;
          for (let j = 0; j !== len; ++j) {
            if (j === localIdx) {
              nextValues[j] = v as ValuesArray<Ts>[number];
            } else {
              nextValues[j] = new Value(cloneIfNeeded(value[j]), safeContext[j]) as ValuesArray<Ts>[number];
            }
          }
          return nextValues;
        })
        .map(tupleWrapper),
    );
  }
  return Stream.nil<TupleExtendedValue<Ts>>().join(...shrinks);
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
      if (arb === null || arb === undefined || arb.generate === null || arb.generate === undefined)
        throw new Error(`Invalid parameter encountered at index ${idx}: expecting an Arbitrary`);
    }
  }
  generate(mrng: Random, biasFactor: number | undefined): Value<Ts> {
    const arbs = this.arbs;
    const len = arbs.length;
    // oxlint-disable-next-line unicorn/no-new-array
    const vs = new Array(len) as Ts & unknown[];
    // oxlint-disable-next-line unicorn/no-new-array
    const ctxs: TupleContext = new Array(len);
    // oxlint-disable-next-line unicorn/no-new-array
    const values = new Array(len) as ValuesArray<Ts>;
    let cloneable = false;
    for (let idx = 0; idx !== len; ++idx) {
      const v = arbs[idx].generate(mrng, biasFactor);
      values[idx] = v;
      vs[idx] = v.value;
      ctxs[idx] = v.context;
      cloneable = cloneable || v.hasToBeCloned;
    }
    if (cloneable) {
      tupleMakeItCloneable(vs, values);
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

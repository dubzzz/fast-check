import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { cloneIfNeeded, cloneMethod, WithCloneMethod } from '../../check/symbols';
import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';

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
  private static makeItCloneable<TValue>(vs: TValue[], values: Value<TValue>[]): WithCloneMethod<TValue[]> {
    return Object.defineProperty(vs, cloneMethod, {
      value: () => {
        const cloned = [];
        for (let idx = 0; idx !== values.length; ++idx) {
          cloned.push(values[idx].value); // push potentially cloned values
        }
        TupleArbitrary.makeItCloneable(cloned, values);
        return cloned;
      },
    }) as unknown as WithCloneMethod<TValue[]>;
  }
  private static wrapper<Ts extends unknown[]>(values: ValuesArray<Ts>): Value<Ts> {
    let cloneable = false;
    const vs = [] as unknown as Ts & unknown[];
    const ctxs: unknown[] = [];
    for (let idx = 0; idx !== values.length; ++idx) {
      const v = values[idx];
      cloneable = cloneable || v.hasToBeCloned;
      vs.push(v.value);
      ctxs.push(v.context);
    }
    if (cloneable) {
      TupleArbitrary.makeItCloneable(vs, values);
    }
    return new Value(vs, ctxs);
  }
  generate(mrng: Random, biasFactor: number | undefined): Value<Ts> {
    return TupleArbitrary.wrapper<Ts>(this.arbs.map((a) => a.generate(mrng, biasFactor)) as ValuesArray<Ts>);
  }
  canShrinkWithoutContext(value: unknown): value is Ts {
    if (!Array.isArray(value) || value.length !== this.arbs.length) {
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
    // shrinking one by one is the not the most comprehensive
    // but allows a reasonable number of entries in the shrink
    let s = Stream.nil<Value<Ts>>();
    const safeContext: unknown[] = Array.isArray(context) ? context : [];
    for (let idx = 0; idx !== this.arbs.length; ++idx) {
      const shrinksForIndex: Stream<Value<Ts>> = this.arbs[idx]
        .shrink(value[idx], safeContext[idx])
        .map((v) => {
          const nextValues: Value<unknown>[] = value.map((v, idx) => new Value(cloneIfNeeded(v), safeContext[idx]));
          return nextValues
            .slice(0, idx)
            .concat([v])
            .concat(nextValues.slice(idx + 1));
        })
        .map((values) => TupleArbitrary.wrapper(values) as Value<Ts>);
      s = s.join(shrinksForIndex);
    }
    return s;
  }
}

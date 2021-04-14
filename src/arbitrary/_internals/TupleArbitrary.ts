import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { cloneIfNeeded, cloneMethod, WithCloneMethod } from '../../check/symbols';
import { NextArbitrary } from '../../check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../check/arbitrary/definition/NextValue';

/** @internal */
type ArbsArray<Ts extends unknown[]> = { [K in keyof Ts]: NextArbitrary<Ts[K]> };
/** @internal */
type ValuesArray<Ts extends unknown[]> = { [K in keyof Ts]: NextValue<Ts[K]> };

/** @internal */
export class GenericTupleArbitrary<Ts extends unknown[]> extends NextArbitrary<Ts> {
  constructor(readonly arbs: ArbsArray<Ts>) {
    super();
    for (let idx = 0; idx !== arbs.length; ++idx) {
      const arb = arbs[idx];
      if (arb == null || arb.generate == null)
        throw new Error(`Invalid parameter encountered at index ${idx}: expecting an Arbitrary`);
    }
  }
  private static makeItCloneable<TValue>(vs: TValue[], values: NextValue<TValue>[]): WithCloneMethod<TValue[]> {
    return Object.defineProperty(vs, cloneMethod, {
      value: () => {
        const cloned = [];
        for (let idx = 0; idx !== values.length; ++idx) {
          cloned.push(values[idx].value); // push potentially cloned values
        }
        GenericTupleArbitrary.makeItCloneable(cloned, values);
        return cloned;
      },
    });
  }
  private static wrapper<Ts extends unknown[]>(values: ValuesArray<Ts>): NextValue<Ts> {
    let cloneable = false;
    const vs = ([] as unknown) as Ts & unknown[];
    const ctxs: unknown[] = [];
    for (let idx = 0; idx !== values.length; ++idx) {
      const v = values[idx];
      cloneable = cloneable || v.hasToBeCloned;
      vs.push(v.value);
      ctxs.push(v.context);
    }
    if (cloneable) {
      GenericTupleArbitrary.makeItCloneable(vs, values);
    }
    return new NextValue(vs, ctxs);
  }
  generate(mrng: Random, biasFactor: number | undefined): NextValue<Ts> {
    return GenericTupleArbitrary.wrapper<Ts>(this.arbs.map((a) => a.generate(mrng, biasFactor)) as ValuesArray<Ts>);
  }
  canGenerate(value: unknown): value is Ts {
    if (!Array.isArray(value) || value.length !== this.arbs.length) {
      return false;
    }
    for (let index = 0; index !== this.arbs.length; ++index) {
      if (!this.arbs[index].canGenerate(value[index])) {
        return false;
      }
    }
    return true;
  }
  shrink(value: Ts, context?: unknown): Stream<NextValue<Ts>> {
    // shrinking one by one is the not the most comprehensive
    // but allows a reasonable number of entries in the shrink
    let s = Stream.nil<NextValue<Ts>>();
    const safeContext: unknown[] = Array.isArray(context) ? context : [];
    for (let idx = 0; idx !== this.arbs.length; ++idx) {
      const shrinksForIndex: Stream<NextValue<Ts>> = this.arbs[idx]
        .shrink(value[idx], safeContext[idx])
        .map((v) => {
          const nextValues: NextValue<unknown>[] = value.map(
            (v, idx) => new NextValue(cloneIfNeeded(v), safeContext[idx])
          );
          return nextValues
            .slice(0, idx)
            .concat([v])
            .concat(nextValues.slice(idx + 1));
        })
        .map((values) => GenericTupleArbitrary.wrapper(values) as NextValue<Ts>);
      s = s.join(shrinksForIndex);
    }
    return s;
  }
}

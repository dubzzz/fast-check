import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { cloneMethod, hasCloneMethod } from '../symbols';
import { Arbitrary } from './definition/Arbitrary';
import { convertFromNext, convertToNext } from './definition/Converters';
import { NextArbitrary } from './definition/NextArbitrary';
import { NextValue } from './definition/NextValue';

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
  private static makeItCloneable<Ts>(vs: Ts[], values: NextValue<Ts>[]) {
    (vs as any)[cloneMethod] = () => {
      const cloned = [];
      for (let idx = 0; idx !== values.length; ++idx) {
        cloned.push(values[idx].value); // push potentially cloned values
      }
      GenericTupleArbitrary.makeItCloneable(cloned, values);
      return cloned;
    };
    return vs;
  }
  private static wrapper<Ts extends unknown[]>(values: ValuesArray<Ts>): NextValue<Ts> {
    let cloneable = false;
    const vs = ([] as unknown) as Ts;
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
  generate(mrng: Random): NextValue<Ts> {
    return GenericTupleArbitrary.wrapper<Ts>(this.arbs.map((a) => a.generate(mrng)) as ValuesArray<Ts>);
  }
  shrink(value: Ts, context?: unknown): Stream<NextValue<Ts>> {
    // shrinking one by one is the not the most comprehensive
    // but allows a reasonable number of entries in the shrink
    let s = Stream.nil<NextValue<Ts>>();
    const safeValue = hasCloneMethod(value) ? value[cloneMethod]() : value;
    const valueWithContext: NextValue<unknown>[] = safeValue.map(
      (v, idx) => new NextValue(v, Array.isArray(context) ? context[idx] : undefined)
    );
    for (let idx = 0; idx !== this.arbs.length; ++idx) {
      const shrinksForIndex: Stream<NextValue<Ts>> = this.arbs[idx]
        .shrink(valueWithContext[idx].value_, valueWithContext[idx].context)
        .map((v) => {
          return valueWithContext
            .slice(0, idx)
            .concat([v])
            .concat(valueWithContext.slice(idx + 1));
        })
        .map((values) => GenericTupleArbitrary.wrapper(values) as NextValue<Ts>);
      s = s.join(shrinksForIndex);
    }
    return s;
  }
  withBias(freq: number): NextArbitrary<Ts> {
    return new GenericTupleArbitrary<Ts>(this.arbs.map((a) => a.withBias(freq)) as ArbsArray<Ts>);
  }
}

/**
 * For tuples produced by the provided `arbs`
 *
 * @param arbs - Ordered list of arbitraries
 *
 * @deprecated Switch to {@link tuple} instead
 * @remarks Since 1.0.0
 * @public
 */
function genericTuple<Ts extends unknown[]>(arbs: { [K in keyof Ts]: Arbitrary<Ts[K]> }): Arbitrary<Ts> {
  const nextArbs = arbs.map((arb) => convertToNext(arb)) as { [K in keyof Ts]: NextArbitrary<Ts[K]> };
  return convertFromNext(new GenericTupleArbitrary<Ts>(nextArbs));
}

/**
 * For tuples produced using the provided `arbs`
 *
 * @param arbs - Ordered list of arbitraries
 *
 * @remarks Since 0.0.1
 * @public
 */
function tuple<Ts extends unknown[]>(...arbs: { [K in keyof Ts]: Arbitrary<Ts[K]> }): Arbitrary<Ts> {
  const nextArbs = arbs.map((arb) => convertToNext(arb)) as { [K in keyof Ts]: NextArbitrary<Ts[K]> };
  return convertFromNext(new GenericTupleArbitrary<Ts>(nextArbs));
}

export { genericTuple, tuple };

import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { cloneMethod } from '../symbols';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';

/** @internal */
type ArbsArray<Ts extends unknown[]> = { [K in keyof Ts]: Arbitrary<Ts[K]> };
/** @internal */
type ShrinksArray<Ts extends unknown[]> = { [K in keyof Ts]: Shrinkable<Ts[K]> };

/** @internal */
export class GenericTupleArbitrary<Ts extends unknown[]> extends Arbitrary<Ts> {
  constructor(readonly arbs: ArbsArray<Ts>) {
    super();
    for (let idx = 0; idx !== arbs.length; ++idx) {
      const arb = arbs[idx];
      if (arb == null || arb.generate == null)
        throw new Error(`Invalid parameter encountered at index ${idx}: expecting an Arbitrary`);
    }
  }
  private static makeItCloneable<Ts>(vs: Ts[], shrinkables: Shrinkable<Ts>[]) {
    (vs as any)[cloneMethod] = () => {
      const cloned = [];
      for (let idx = 0; idx !== shrinkables.length; ++idx) {
        cloned.push(shrinkables[idx].value); // push potentially cloned values
      }
      GenericTupleArbitrary.makeItCloneable(cloned, shrinkables);
      return cloned;
    };
    return vs;
  }
  private static wrapper<Ts extends unknown[]>(shrinkables: ShrinksArray<Ts>): Shrinkable<Ts> {
    let cloneable = false;
    const vs = ([] as unknown) as Ts;
    for (let idx = 0; idx !== shrinkables.length; ++idx) {
      const s = shrinkables[idx];
      cloneable = cloneable || s.hasToBeCloned;
      vs.push(s.value);
    }
    if (cloneable) {
      GenericTupleArbitrary.makeItCloneable(vs, shrinkables);
    }
    return new Shrinkable(vs, () => GenericTupleArbitrary.shrinkImpl(shrinkables).map(GenericTupleArbitrary.wrapper));
  }
  generate(mrng: Random): Shrinkable<Ts> {
    return GenericTupleArbitrary.wrapper<Ts>(this.arbs.map((a) => a.generate(mrng)) as ShrinksArray<Ts>);
  }
  private static shrinkImpl<Ts extends unknown[]>(value: ShrinksArray<Ts>): Stream<ShrinksArray<Ts>> {
    // shrinking one by one is the not the most comprehensive
    // but allows a reasonable number of entries in the shrink
    let s = Stream.nil<ShrinksArray<Ts>>();
    for (let idx = 0; idx !== value.length; ++idx) {
      s = s.join(
        value[idx].shrink().map(
          (v) =>
            value
              .slice(0, idx)
              .concat([v])
              .concat(value.slice(idx + 1)) as ShrinksArray<Ts>
        )
      );
    }
    return s;
  }
  withBias(freq: number): Arbitrary<Ts> {
    return new GenericTupleArbitrary<Ts>(this.arbs.map((a) => a.withBias(freq)) as ArbsArray<Ts>);
  }
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
  return new GenericTupleArbitrary<Ts>(arbs);
}

export { tuple };

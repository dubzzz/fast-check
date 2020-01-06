import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { cloneMethod } from '../symbols';
import { Arbitrary } from './definition/Arbitrary';
import { Shrinkable } from './definition/Shrinkable';

/** @internal */
class GenericTupleArbitrary<Ts> extends Arbitrary<Ts[]> {
  constructor(readonly arbs: Arbitrary<Ts>[]) {
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
  private static wrapper<Ts>(shrinkables: Shrinkable<Ts>[]): Shrinkable<Ts[]> {
    let cloneable = false;
    const vs = [];
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
  generate(mrng: Random): Shrinkable<Ts[]> {
    return GenericTupleArbitrary.wrapper(this.arbs.map(a => a.generate(mrng)));
  }
  private static shrinkImpl<Ts>(value: Shrinkable<Ts>[]): Stream<Shrinkable<Ts>[]> {
    // shrinking one by one is the not the most comprehensive
    // but allows a reasonable number of entries in the shrink
    let s = Stream.nil<Shrinkable<Ts>[]>();
    for (let idx = 0; idx !== value.length; ++idx) {
      s = s.join(
        value[idx].shrink().map(v =>
          value
            .slice(0, idx)
            .concat([v])
            .concat(value.slice(idx + 1))
        )
      );
    }
    return s;
  }
  withBias(freq: number) {
    return new GenericTupleArbitrary(this.arbs.map(a => a.withBias(freq)));
  }
}

/**
 * For tuples produced by the provided `arbs`
 * @param arbs Ordered list of arbitraries
 */
function genericTuple<Ts>(arbs: Arbitrary<Ts>[]): Arbitrary<Ts[]> {
  return new GenericTupleArbitrary(arbs);
}

export { GenericTupleArbitrary, genericTuple };

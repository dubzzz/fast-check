import Random from '../../random/generator/Random';
import { Stream, stream } from '../../stream/Stream';
import Arbitrary from './definition/Arbitrary';
import Shrinkable from './definition/Shrinkable';

/** @internalapi */
class GenericTupleArbitrary<Ts> extends Arbitrary<Ts[]> {
  constructor(readonly arbs: Arbitrary<Ts>[]) {
    super();
    for (let idx = 0; idx !== arbs.length; ++idx) {
      const arb = arbs[idx];
      if (arb == null || arb.generate == null)
        throw new Error(`Invalid parameter encountered at index ${idx}: expecting an Arbitrary`);
    }
  }
  private static wrapper<Ts>(shrinkables: Shrinkable<Ts>[]): Shrinkable<Ts[]> {
    return new Shrinkable(shrinkables.map(s => s.value), () =>
      GenericTupleArbitrary.shrinkImpl(shrinkables).map(GenericTupleArbitrary.wrapper)
    );
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
}

function genericTuple<Ts>(arbs: Arbitrary<Ts>[]): Arbitrary<Ts[]> {
  return new GenericTupleArbitrary(arbs);
}

export { GenericTupleArbitrary, genericTuple };

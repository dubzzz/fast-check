import Random from '../../random/generator/Random';
import { Stream, stream } from '../../stream/Stream';
import Arbitrary from './definition/Arbitrary';
import Shrinkable from './definition/Shrinkable';

class GenericTupleArbitrary extends Arbitrary<any[]> {
  constructor(readonly arbs: Arbitrary<any>[]) {
    super();
  }
  private static wrapper(shrinkables: Shrinkable<any>[]): Shrinkable<any[]> {
    return new Shrinkable(shrinkables.map(s => s.value), () =>
      GenericTupleArbitrary.shrinkImpl(shrinkables).map(GenericTupleArbitrary.wrapper)
    );
  }
  generate(mrng: Random): Shrinkable<any[]> {
    return GenericTupleArbitrary.wrapper(this.arbs.map(a => a.generate(mrng)));
  }
  private static shrinkImpl(value: Shrinkable<any>[]): Stream<Shrinkable<any>[]> {
    // shrinking one by one is the not the most comprehensive
    // but allows a reasonable number of entries in the shrink
    let s = Stream.nil<any[]>();
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

function generic_tuple(arbs: Arbitrary<any>[]): Arbitrary<any[]> {
  return new GenericTupleArbitrary(arbs);
}

export { GenericTupleArbitrary, generic_tuple };

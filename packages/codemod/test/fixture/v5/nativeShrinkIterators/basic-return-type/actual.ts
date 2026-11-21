import * as fc from 'fast-check';

abstract class Numbers extends fc.Arbitrary<number> {
  shrink(value: number): fc.Stream<fc.Value<number>> { return fc.Stream.nil(); }
}

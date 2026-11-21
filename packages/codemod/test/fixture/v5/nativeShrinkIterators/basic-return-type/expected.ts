import * as fc from 'fast-check';

abstract class Numbers extends fc.Arbitrary<number> {
  shrink(value: number): IteratorObject<fc.Value<number>> { return Iterator.from([]); }
}

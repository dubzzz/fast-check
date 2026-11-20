import * as fc from 'fast-check';

abstract class Numbers extends fc.Arbitrary<number> {
  shrink(value: number) { return fc.stream([new fc.Value(value, undefined)].values()); }
}

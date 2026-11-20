import * as fc from 'fast-check';

abstract class Numbers extends fc.Arbitrary<number> {
  shrink(value: number) {
    const candidates = fc.Stream.of(new fc.Value(value, undefined));
    // Native iterators do not provide getNthOrLast, so the entire shrink method needs review.
    candidates.getNthOrLast(2);
    return candidates;
  }
}

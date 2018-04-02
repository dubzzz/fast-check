import Random from '../../random/generator/Random';
import { Stream, stream } from '../../stream/Stream';
import { Arbitrary, ArbitraryWithShrink } from './definition/Arbitrary';
import Shrinkable from './definition/Shrinkable';
import { integer } from './IntegerArbitrary';

class ArrayArbitrary<T> extends Arbitrary<T[]> {
  readonly lengthArb: ArbitraryWithShrink<number>;
  constructor(
    readonly arb: Arbitrary<T>,
    readonly minLength: number,
    maxLength: number,
    readonly preFilter: (tab: Shrinkable<T>[]) => Shrinkable<T>[] = tab => tab
  ) {
    super();
    this.lengthArb = integer(minLength, maxLength);
  }
  private wrapper(itemsRaw: Shrinkable<T>[]): Shrinkable<T[]> {
    const items = this.preFilter(itemsRaw);
    return new Shrinkable(items.map(s => s.value), () => this.shrinkImpl(items).map(v => this.wrapper(v)));
  }
  generate(mrng: Random): Shrinkable<T[]> {
    const size = this.lengthArb.generate(mrng);
    const items = [...Array(size.value)].map(() => this.arb.generate(mrng));
    return this.wrapper(items);
  }
  private shrinkImpl(items: Shrinkable<T>[]): Stream<Shrinkable<T>[]> {
    // shrinking one by one is the not the most comprehensive
    // but allows a reasonable number of entries in the shrink
    if (items.length === 0) {
      return Stream.nil<Shrinkable<T>[]>();
    }
    const size = this.lengthArb.shrinkableFor(items.length);
    return size
      .shrink()
      .map(l => items.slice(items.length - l.value))
      .join(items[0].shrink().map(v => [v].concat(items.slice(1))))
      .join(
        this.shrinkImpl(items.slice(1))
          .filter(vs => this.minLength <= vs.length + 1)
          .map(vs => [items[0]].concat(vs))
      );
  }
}

function array<T>(arb: Arbitrary<T>): Arbitrary<T[]>;
function array<T>(arb: Arbitrary<T>, maxLength: number): Arbitrary<T[]>;
function array<T>(arb: Arbitrary<T>, minLength: number, maxLength: number): Arbitrary<T[]>;
function array<T>(arb: Arbitrary<T>, aLength?: number, bLength?: number): Arbitrary<T[]> {
  if (bLength == null) return new ArrayArbitrary<T>(arb, 0, aLength == null ? 10 : aLength);
  return new ArrayArbitrary<T>(arb, aLength || 0, bLength);
}

export { array, ArrayArbitrary };

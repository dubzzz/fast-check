import Random from '../../random/generator/Random';
import { Stream, stream } from '../../stream/Stream';
import { Arbitrary } from './definition/Arbitrary';
import { ArbitraryWithShrink } from './definition/ArbitraryWithShrink';
import Shrinkable from './definition/Shrinkable';
import { integer } from './IntegerArbitrary';

/** @internalapi */
class ArrayArbitrary<T> extends Arbitrary<T[]> {
  readonly lengthArb: ArbitraryWithShrink<number>;
  constructor(
    readonly arb: Arbitrary<T>,
    readonly minLength: number,
    readonly maxLength: number,
    readonly preFilter: (tab: Shrinkable<T>[]) => Shrinkable<T>[] = tab => tab
  ) {
    super();
    this.lengthArb = integer(minLength, maxLength);
  }
  private wrapper(itemsRaw: Shrinkable<T>[], shrunkOnce: boolean): Shrinkable<T[]> {
    const items = this.preFilter(itemsRaw);
    return new Shrinkable(items.map(s => s.value), () =>
      this.shrinkImpl(items, shrunkOnce).map(v => this.wrapper(v, true))
    );
  }
  generate(mrng: Random): Shrinkable<T[]> {
    const size = this.lengthArb.generate(mrng);
    const items = [...Array(size.value)].map(() => this.arb.generate(mrng));
    return this.wrapper(items, false);
  }
  private shrinkImpl(items: Shrinkable<T>[], shrunkOnce: boolean): Stream<Shrinkable<T>[]> {
    // shrinking one by one is the not the most comprehensive
    // but allows a reasonable number of entries in the shrink
    if (items.length === 0) {
      return Stream.nil<Shrinkable<T>[]>();
    }
    const size = this.lengthArb.shrinkableFor(items.length, shrunkOnce);
    return size
      .shrink()
      .map(l => items.slice(items.length - l.value))
      .join(items[0].shrink().map(v => [v].concat(items.slice(1))))
      .join(
        items.length > this.minLength
          ? this.shrinkImpl(items.slice(1), false)
              .filter(vs => this.minLength <= vs.length + 1)
              .map(vs => [items[0]].concat(vs))
          : Stream.nil<Shrinkable<T>[]>()
      );
  }
}

/**
 * For arrays of values coming from `arb`
 * @param arb Arbitrary used to generate the values inside the array
 */
function array<T>(arb: Arbitrary<T>): Arbitrary<T[]>;
/**
 * For arrays of values coming from `arb` having an upper bound size
 * @param arb Arbitrary used to generate the values inside the array
 * @param maxLength Upper bound of the generated array size
 */
function array<T>(arb: Arbitrary<T>, maxLength: number): Arbitrary<T[]>;
/**
 * For arrays of values coming from `arb` having lower and upper bound size
 * @param arb Arbitrary used to generate the values inside the array
 * @param minLength Lower bound of the generated array size
 * @param maxLength Upper bound of the generated array size
 */
function array<T>(arb: Arbitrary<T>, minLength: number, maxLength: number): Arbitrary<T[]>;
function array<T>(arb: Arbitrary<T>, aLength?: number, bLength?: number): Arbitrary<T[]> {
  if (bLength == null) return new ArrayArbitrary<T>(arb, 0, aLength == null ? 10 : aLength);
  return new ArrayArbitrary<T>(arb, aLength || 0, bLength);
}

export { array, ArrayArbitrary };

import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Arbitrary } from './definition/Arbitrary';
import { ArbitraryWithShrink } from './definition/ArbitraryWithShrink';
import { biasWrapper } from './definition/BiasedArbitraryWrapper';
import { Shrinkable } from './definition/Shrinkable';
import { integer } from './IntegerArbitrary';

/** @internal */
class SubarrayArbitrary<T> extends Arbitrary<T[]> {
  readonly lengthArb: ArbitraryWithShrink<number>;
  constructor(
    readonly originalArray: T[],
    readonly isOrdered: boolean,
    readonly minLength: number,
    readonly maxLength: number
  ) {
    super();
    if (minLength < 0 || minLength > originalArray.length)
      throw new Error(
        'fc.*{s|S}ubarrayOf expects the minimal length to be between 0 and the size of the original array'
      );
    if (maxLength < 0 || maxLength > originalArray.length)
      throw new Error(
        'fc.*{s|S}ubarrayOf expects the maximal length to be between 0 and the size of the original array'
      );
    if (minLength > maxLength)
      throw new Error('fc.*{s|S}ubarrayOf expects the minimal length to be inferior or equal to the maximal length');
    this.lengthArb = integer(minLength, maxLength);
  }
  private wrapper(items: T[], shrunkOnce: boolean): Shrinkable<T[]> {
    return new Shrinkable(items, () => this.shrinkImpl(items, shrunkOnce).map(v => this.wrapper(v, true)));
  }
  generate(mrng: Random): Shrinkable<T[]> {
    const remainingElements = this.originalArray.map((v, idx) => idx);
    const size = this.lengthArb.generate(mrng).value;
    const ids: number[] = [];
    for (let idx = 0; idx !== size; ++idx) {
      const selectedIdIndex = mrng.nextInt(0, remainingElements.length - 1);
      ids.push(remainingElements[selectedIdIndex]);
      remainingElements.splice(selectedIdIndex, 1);
    }
    if (this.isOrdered) ids.sort((a, b) => a - b);
    return this.wrapper(ids.map(i => this.originalArray[i]), false);
  }
  private shrinkImpl(items: T[], shrunkOnce: boolean): Stream<T[]> {
    // shrinking one by one is the not the most comprehensive
    // but allows a reasonable number of entries in the shrink
    if (items.length === 0) {
      return Stream.nil<T[]>();
    }
    const size = this.lengthArb.shrinkableFor(items.length, shrunkOnce);
    return size
      .shrink()
      .map(l => items.slice(items.length - l.value))
      .join(
        items.length > this.minLength
          ? this.shrinkImpl(items.slice(1), false)
              .filter(vs => this.minLength <= vs.length + 1)
              .map(vs => [items[0]].concat(vs))
          : Stream.nil<T[]>()
      );
  }
  withBias(freq: number): Arbitrary<T[]> {
    return this.minLength !== this.maxLength
      ? biasWrapper(freq, this, (originalArbitrary: SubarrayArbitrary<T>) => {
          return new SubarrayArbitrary(
            originalArbitrary.originalArray,
            originalArbitrary.isOrdered,
            originalArbitrary.minLength,
            originalArbitrary.minLength +
              Math.floor(Math.log(originalArbitrary.maxLength - originalArbitrary.minLength) / Math.log(2))
          );
        })
      : this;
  }
}

/**
 * For subarrays of `originalArray` (keeps ordering)
 * @param originalArray Original array
 */
function subarray<T>(originalArray: T[]): Arbitrary<T[]>;
/**
 * For subarrays of `originalArray` (keeps ordering)
 * @param originalArray Original array
 * @param minLength Lower bound of the generated array size
 * @param maxLength Upper bound of the generated array size
 */
function subarray<T>(originalArray: T[], minLength: number, maxLength: number): Arbitrary<T[]>;
function subarray<T>(originalArray: T[], minLength?: number, maxLength?: number): Arbitrary<T[]> {
  if (minLength != null && maxLength != null) return new SubarrayArbitrary(originalArray, true, minLength, maxLength);
  return new SubarrayArbitrary(originalArray, true, 0, originalArray.length);
}

/**
 * For subarrays of `originalArray`
 * @param originalArray Original array
 */
function shuffledSubarray<T>(originalArray: T[]): Arbitrary<T[]>;
/**
 * For subarrays of `originalArray`
 * @param originalArray Original array
 * @param minLength Lower bound of the generated array size
 * @param maxLength Upper bound of the generated array size
 */
function shuffledSubarray<T>(originalArray: T[], minLength: number, maxLength: number): Arbitrary<T[]>;
function shuffledSubarray<T>(originalArray: T[], minLength?: number, maxLength?: number): Arbitrary<T[]> {
  if (minLength != null && maxLength != null) return new SubarrayArbitrary(originalArray, false, minLength, maxLength);
  return new SubarrayArbitrary(originalArray, false, 0, originalArray.length);
}

export { subarray, shuffledSubarray };

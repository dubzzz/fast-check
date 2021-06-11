import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Arbitrary } from './definition/Arbitrary';
import { ArbitraryWithContextualShrink } from './definition/ArbitraryWithContextualShrink';
import { biasWrapper } from './definition/BiasedArbitraryWrapper';
import { Shrinkable } from './definition/Shrinkable';
import { integer } from '../../arbitrary/integer';
import { makeLazy } from '../../stream/LazyIterableIterator';

/** @internal */
class SubarrayArbitrary<T> extends Arbitrary<T[]> {
  readonly lengthArb: ArbitraryWithContextualShrink<number>;
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
  private wrapper(items: T[], itemsLengthContext: unknown): Shrinkable<T[]> {
    return new Shrinkable(items, () =>
      this.shrinkImpl(items, itemsLengthContext).map((contextualValue) =>
        this.wrapper(contextualValue[0], contextualValue[1])
      )
    );
  }
  generate(mrng: Random): Shrinkable<T[]> {
    const remainingElements = this.originalArray.map((_v, idx) => idx);
    const size = this.lengthArb.generate(mrng).value;
    const ids: number[] = [];
    for (let idx = 0; idx !== size; ++idx) {
      const selectedIdIndex = mrng.nextInt(0, remainingElements.length - 1);
      ids.push(remainingElements[selectedIdIndex]);
      remainingElements.splice(selectedIdIndex, 1);
    }
    if (this.isOrdered) ids.sort((a, b) => a - b);
    return this.wrapper(
      ids.map((i) => this.originalArray[i]),
      undefined
    );
  }
  private shrinkImpl(items: T[], itemsLengthContext: unknown): Stream<[T[], unknown]> {
    // shrinking one by one is the not the most comprehensive
    // but allows a reasonable number of entries in the shrink
    if (items.length === 0) {
      return Stream.nil<[T[], unknown]>();
    }
    return this.lengthArb
      .contextualShrink(items.length, itemsLengthContext)
      .map((contextualValue): [T[], unknown] => {
        return [
          items.slice(items.length - contextualValue[0]), // array of length contextualValue[0]
          contextualValue[1], // integer context for value contextualValue[0] (the length)
        ];
      })
      .join(
        items.length > this.minLength
          ? makeLazy(() =>
              this.shrinkImpl(items.slice(1), undefined)
                .filter((contextualValue) => this.minLength <= contextualValue[0].length + 1)
                .map((contextualValue) => [[items[0]].concat(contextualValue[0]), undefined])
            )
          : Stream.nil<[T[], unknown]>()
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
 * Constraints to be applied on {@link subarray} and {@link shuffledSubarray}
 * @remarks Since 2.4.0
 * @public
 */
export interface SubarrayConstraints {
  /**
   * Lower bound of the generated subarray size (included)
   * @defaultValue 0
   * @remarks Since 2.4.0
   */
  minLength?: number;
  /**
   * Upper bound of the generated subarray size (included)
   * @defaultValue The length of the original array itself
   * @remarks Since 2.4.0
   */
  maxLength?: number;
}

/**
 * For subarrays of `originalArray` (keeps ordering)
 *
 * @param originalArray - Original array
 *
 * @remarks Since 1.5.0
 * @public
 */
function subarray<T>(originalArray: T[]): Arbitrary<T[]>;
/**
 * For subarrays of `originalArray` (keeps ordering)
 *
 * @param originalArray - Original array
 * @param minLength - Lower bound of the generated array size
 * @param maxLength - Upper bound of the generated array size
 *
 * @deprecated
 * Superceded by `fc.subarray(originalArray, {minLength, maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 1.5.0
 * @public
 */
function subarray<T>(originalArray: T[], minLength: number, maxLength: number): Arbitrary<T[]>;
/**
 * For subarrays of `originalArray` (keeps ordering)
 *
 * @param originalArray - Original array
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.4.0
 * @public
 */
function subarray<T>(originalArray: T[], constraints: SubarrayConstraints): Arbitrary<T[]>;
function subarray<T>(originalArray: T[], ...args: [] | [number, number] | [SubarrayConstraints]): Arbitrary<T[]> {
  if (typeof args[0] === 'number' && typeof args[1] === 'number') {
    return new SubarrayArbitrary(originalArray, true, args[0], args[1]);
  }
  const ct = args[0] as SubarrayConstraints | undefined;
  const minLength = ct !== undefined && ct.minLength !== undefined ? ct.minLength : 0;
  const maxLength = ct !== undefined && ct.maxLength !== undefined ? ct.maxLength : originalArray.length;
  return new SubarrayArbitrary(originalArray, true, minLength, maxLength);
}

/**
 * For subarrays of `originalArray`
 *
 * @param originalArray - Original array
 *
 * @remarks Since 1.5.0
 * @public
 */
function shuffledSubarray<T>(originalArray: T[]): Arbitrary<T[]>;
/**
 * For subarrays of `originalArray`
 *
 * @param originalArray - Original array
 * @param minLength - Lower bound of the generated array size
 * @param maxLength - Upper bound of the generated array size
 *
 * @deprecated
 * Superceded by `fc.shuffledSubarray(originalArray, {minLength, maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 1.5.0
 * @public
 */
function shuffledSubarray<T>(originalArray: T[], minLength: number, maxLength: number): Arbitrary<T[]>;
/**
 * For subarrays of `originalArray`
 *
 * @param originalArray - Original array
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.4.0
 * @public
 */
function shuffledSubarray<T>(originalArray: T[], constraints: SubarrayConstraints): Arbitrary<T[]>;
function shuffledSubarray<T>(
  originalArray: T[],
  ...args: [] | [number, number] | [SubarrayConstraints]
): Arbitrary<T[]> {
  if (typeof args[0] === 'number' && typeof args[1] === 'number') {
    return new SubarrayArbitrary(originalArray, false, args[0], args[1]);
  }
  const ct = args[0] as SubarrayConstraints | undefined;
  const minLength = ct !== undefined && ct.minLength !== undefined ? ct.minLength : 0;
  const maxLength = ct !== undefined && ct.maxLength !== undefined ? ct.maxLength : originalArray.length;
  return new SubarrayArbitrary(originalArray, false, minLength, maxLength);
}

export { subarray, shuffledSubarray };

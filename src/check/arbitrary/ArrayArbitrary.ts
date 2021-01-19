import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { cloneMethod } from '../symbols';
import { Arbitrary } from './definition/Arbitrary';
import { ArbitraryWithContextualShrink } from './definition/ArbitraryWithContextualShrink';
import { biasWrapper } from './definition/BiasedArbitraryWrapper';
import { Shrinkable } from './definition/Shrinkable';
import { integer } from './IntegerArbitrary';
import { makeLazy } from '../../stream/LazyIterableIterator';
import { buildCompareFilter } from './helpers/BuildCompareFilter';

/** @internal */
export class ArrayArbitrary<T> extends Arbitrary<T[]> {
  readonly lengthArb: ArbitraryWithContextualShrink<number>;
  readonly preFilter: (tab: Shrinkable<T>[]) => Shrinkable<T>[];

  constructor(
    readonly arb: Arbitrary<T>,
    readonly minLength: number,
    readonly maxLength: number,
    // Whenever passing a isEqual to ArrayArbitrary, you also have to filter
    // it's output just in case produced values are too small (below minLength)
    readonly isEqual?: (valueA: T, valueB: T) => boolean
  ) {
    super();
    this.lengthArb = integer(minLength, maxLength);
    this.preFilter = this.isEqual !== undefined ? buildCompareFilter(this.isEqual) : (tab: Shrinkable<T>[]) => tab;
  }
  private static makeItCloneable<T>(vs: T[], shrinkables: Shrinkable<T>[]) {
    (vs as any)[cloneMethod] = () => {
      const cloned = [];
      for (let idx = 0; idx !== shrinkables.length; ++idx) {
        cloned.push(shrinkables[idx].value); // push potentially cloned values
      }
      this.makeItCloneable(cloned, shrinkables);
      return cloned;
    };
    return vs;
  }
  private canAppendItem(items: Shrinkable<T>[], newItem: Shrinkable<T>): boolean {
    if (this.isEqual === undefined) {
      return true;
    }
    for (let idx = 0; idx !== items.length; ++idx) {
      if (this.isEqual(items[idx].value_, newItem.value_)) {
        return false;
      }
    }
    return true;
  }
  private wrapper(itemsRaw: Shrinkable<T>[], shrunkOnce: boolean, itemsRawLengthContext: unknown): Shrinkable<T[]> {
    // We need to explicitly apply filtering on shrink items
    // has they might have duplicates (on non shrunk it is not the case by construct)
    const items = shrunkOnce ? this.preFilter(itemsRaw) : itemsRaw;
    let cloneable = false;
    const vs = [];
    for (let idx = 0; idx !== items.length; ++idx) {
      const s = items[idx];
      cloneable = cloneable || s.hasToBeCloned;
      vs.push(s.value);
    }
    if (cloneable) {
      ArrayArbitrary.makeItCloneable(vs, items);
    }
    const itemsLengthContext =
      itemsRaw.length === items.length && itemsRawLengthContext !== undefined
        ? itemsRawLengthContext // items and itemsRaw have the same length context is applicable
        : shrunkOnce // otherwise we fallback to default contexts
        ? this.lengthArb.shrunkOnceContext() // in case we shrunk once we use a dedicated context that should reduce shrink size
        : undefined;
    return new Shrinkable(vs, () =>
      this.shrinkImpl(items, itemsLengthContext).map((contextualValue) =>
        this.wrapper(contextualValue[0], true, contextualValue[1])
      )
    );
  }
  generate(mrng: Random): Shrinkable<T[]> {
    const targetSizeShrinkable = this.lengthArb.generate(mrng);
    const targetSize = targetSizeShrinkable.value;

    let numSkippedInRow = 0;
    const items: Shrinkable<T>[] = [];
    // Try to append into items up to the target size
    // In the case of a set we may reject some items as they are already part of the set
    // so we need to retry and generate other ones. In order to prevent infinite loop,
    // we accept a max of maxLength consecutive failures. This circuit breaker may cause
    // generated to be smaller than the minimal accepted one.
    while (items.length < targetSize && numSkippedInRow < this.maxLength) {
      const current = this.arb.generate(mrng);
      if (this.canAppendItem(items, current)) {
        numSkippedInRow = 0;
        items.push(current);
      } else {
        numSkippedInRow += 1;
      }
    }
    return this.wrapper(items, false, undefined);
  }
  private shrinkImpl(items: Shrinkable<T>[], itemsLengthContext: unknown): Stream<[Shrinkable<T>[], unknown]> {
    if (items.length === 0) {
      return Stream.nil<[Shrinkable<T>[], unknown]>();
    }
    return (
      this.lengthArb
        .contextualShrink(
          items.length,
          // itemsLengthContext is a context returned by a previous call to the integer
          // abitrary and the integral value items.length.
          itemsLengthContext
        )
        .map((contextualValue): [Shrinkable<T>[], unknown] => {
          return [
            items.slice(items.length - contextualValue[0]), // array of length contextualValue[0]
            contextualValue[1], // integer context for value contextualValue[0] (the length)
          ];
        })
        // Context value will be set to undefined for remaining shrinking values
        // as they are outside of our shrinking process focused on items.length.
        // None of our computed contexts will apply for them.
        .join(items[0].shrink().map((v) => [[v].concat(items.slice(1)), undefined]))
        .join(
          items.length > this.minLength
            ? makeLazy(() =>
                // We pass itemsLengthContext=undefined to next shrinker to start shrinking
                // without any assumptions on the current state (we never explored that one)
                this.shrinkImpl(items.slice(1), undefined)
                  .filter((contextualValue) => this.minLength <= contextualValue[0].length + 1)
                  .map((contextualValue) => [[items[0]].concat(contextualValue[0]), undefined])
              )
            : Stream.nil<[Shrinkable<T>[], unknown]>()
        )
    );
  }
  withBias(freq: number): Arbitrary<T[]> {
    return biasWrapper(freq, this, (originalArbitrary: ArrayArbitrary<T>) => {
      const lowBiased = new ArrayArbitrary(
        originalArbitrary.arb.withBias(freq),
        originalArbitrary.minLength,
        originalArbitrary.maxLength,
        originalArbitrary.isEqual
      );
      const highBiasedArbBuilder = () => {
        return originalArbitrary.minLength !== originalArbitrary.maxLength
          ? new ArrayArbitrary(
              originalArbitrary.arb.withBias(freq),
              originalArbitrary.minLength,
              originalArbitrary.minLength +
                Math.floor(Math.log(originalArbitrary.maxLength - originalArbitrary.minLength) / Math.log(2)),
              originalArbitrary.isEqual
            )
          : new ArrayArbitrary(
              originalArbitrary.arb.withBias(freq),
              originalArbitrary.minLength,
              originalArbitrary.maxLength,
              originalArbitrary.isEqual
            );
      };
      return biasWrapper(freq, lowBiased, highBiasedArbBuilder);
    });
  }
}

/**
 * Compute `maxLength` based on `minLength`
 * @internal
 */
export function maxLengthFromMinLength(minLength: number): number {
  return 2 * minLength + 10;
}

/**
 * Constraints to be applied on {@link array}
 * @public
 */
export interface ArrayConstraints {
  /** Lower bound of the generated array size */
  minLength?: number;
  /** Upper bound of the generated array size */
  maxLength?: number;
}

/**
 * For arrays of values coming from `arb`
 * @param arb - Arbitrary used to generate the values inside the array
 * @public
 */
function array<T>(arb: Arbitrary<T>): Arbitrary<T[]>;
/**
 * For arrays of values coming from `arb` having an upper bound size
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param maxLength - Upper bound of the generated array size
 *
 * @deprecated
 * Superceded by `fc.array(arb, {maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/master/codemods/unify-signatures | our codemod script}.
 *
 * @public
 */
function array<T>(arb: Arbitrary<T>, maxLength: number): Arbitrary<T[]>;
/**
 * For arrays of values coming from `arb` having lower and upper bound size
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param minLength - Lower bound of the generated array size
 * @param maxLength - Upper bound of the generated array size
 *
 * @deprecated
 * Superceded by `fc.array(arb, {minLength, maxLength})` - see {@link https://github.com/dubzzz/fast-check/issues/992 | #992}.
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/master/codemods/unify-signatures | our codemod script}.
 *
 * @public
 */
function array<T>(arb: Arbitrary<T>, minLength: number, maxLength: number): Arbitrary<T[]>;
/**
 * For arrays of values coming from `arb` having lower and upper bound size
 * @param arb - Arbitrary used to generate the values inside the array
 * @param constraints - Constraints to apply when building instances
 * @public
 */
function array<T>(arb: Arbitrary<T>, constraints: ArrayConstraints): Arbitrary<T[]>;
function array<T>(arb: Arbitrary<T>, ...args: [] | [number] | [number, number] | [ArrayConstraints]): Arbitrary<T[]> {
  // fc.array(arb)
  if (args[0] === undefined) return new ArrayArbitrary<T>(arb, 0, maxLengthFromMinLength(0));
  // fc.array(arb, constraints)
  if (typeof args[0] === 'object') {
    const minLength = args[0].minLength || 0;
    const specifiedMaxLength = args[0].maxLength;
    const maxLength = specifiedMaxLength !== undefined ? specifiedMaxLength : maxLengthFromMinLength(minLength);
    return new ArrayArbitrary<T>(arb, minLength, maxLength);
  }
  // fc.array(arb, minLength, maxLength)
  if (args[1] !== undefined) return new ArrayArbitrary<T>(arb, args[0], args[1]);
  // fc.array(arb, maxLength)
  return new ArrayArbitrary<T>(arb, 0, args[0]);
}

export { array };

import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { cloneIfNeeded, cloneMethod } from '../symbols';
import { Arbitrary } from './definition/Arbitrary';
import { integer } from './IntegerArbitrary';
import { makeLazy } from '../../stream/LazyIterableIterator';
import { buildCompareFilter } from './helpers/BuildCompareFilter';
import { NextArbitrary } from './definition/NextArbitrary';
import { convertFromNext, convertToNext } from './definition/Converters';
import { NextValue } from './definition/NextValue';

/** @internal */
type ArrayArbitraryContext = {
  shrunkOnce: boolean;
  lengthContext: unknown;
  itemsContexts: unknown[];
};

/** @internal */
export class ArrayArbitrary<T> extends NextArbitrary<T[]> {
  readonly lengthArb: NextArbitrary<number>;
  readonly preFilter: (tab: NextValue<T>[]) => NextValue<T>[];

  constructor(
    readonly arb: NextArbitrary<T>,
    readonly minLength: number,
    readonly maxLength: number,
    // Whenever passing a isEqual to ArrayArbitrary, you also have to filter
    // it's output just in case produced values are too small (below minLength)
    readonly isEqual?: (valueA: T, valueB: T) => boolean
  ) {
    super();
    this.lengthArb = convertToNext(integer(minLength, maxLength));
    this.preFilter = this.isEqual !== undefined ? buildCompareFilter(this.isEqual) : (tab: NextValue<T>[]) => tab;
  }

  private static makeItCloneable<T>(vs: T[], shrinkables: NextValue<T>[]) {
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

  private canAppendItem(items: NextValue<T>[], newItem: NextValue<T>): boolean {
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

  private wrapper(itemsRaw: NextValue<T>[], shrunkOnce: boolean, itemsRawLengthContext: unknown): NextValue<T[]> {
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
    const context: ArrayArbitraryContext = {
      shrunkOnce,
      lengthContext:
        itemsRaw.length === items.length && itemsRawLengthContext !== undefined
          ? itemsRawLengthContext // items and itemsRaw have the same length context is applicable
          : undefined,
      itemsContexts: items.map((v) => v.context),
    };
    return new NextValue(vs, context);
  }

  generate(mrng: Random, biasFactor: number | undefined): NextValue<T[]> {
    const biasMeta = this.applyBias(mrng, biasFactor);
    const targetSize = biasMeta.size;

    let numSkippedInRow = 0;
    const items: NextValue<T>[] = [];
    // Try to append into items up to the target size
    // In the case of a set we may reject some items as they are already part of the set
    // so we need to retry and generate other ones. In order to prevent infinite loop,
    // we accept a max of maxLength consecutive failures. This circuit breaker may cause
    // generated to be smaller than the minimal accepted one.
    while (items.length < targetSize && numSkippedInRow < this.maxLength) {
      const current = this.arb.generate(mrng, biasMeta.biasFactorItems);
      if (this.canAppendItem(items, current)) {
        numSkippedInRow = 0;
        items.push(current);
      } else {
        numSkippedInRow += 1;
      }
    }
    return this.wrapper(items, false, undefined);
  }

  private applyBias(mrng: Random, biasFactor: number | undefined): { size: number; biasFactorItems?: number } {
    if (biasFactor === undefined || mrng.nextInt(1, biasFactor) !== 1) {
      // We don't bias anything
      return { size: this.lengthArb.generate(mrng, undefined).value };
    }
    // We apply bias (1 chance over biasFactor)
    if (mrng.nextInt(1, biasFactor) !== 1 || this.minLength === this.maxLength) {
      // We only apply bias on items ((biasFactor-1) chances over biasFactor²)
      return { size: this.lengthArb.generate(mrng, undefined).value, biasFactorItems: biasFactor };
    }
    // We apply bias for both items and length (1 chance over biasFactor²)
    const maxBiasedLength = this.minLength + Math.floor(Math.log(this.maxLength - this.minLength) / Math.log(2));
    const targetSizeValue = convertToNext(integer(this.minLength, maxBiasedLength)).generate(mrng, undefined);
    return { size: targetSizeValue.value, biasFactorItems: biasFactor };
  }

  canGenerate(value: unknown): value is T[] {
    if (!Array.isArray(value) || this.minLength > value.length || value.length > this.maxLength) {
      return false;
    }
    for (let index = 0; index !== value.length; ++index) {
      if (!(index in value)) {
        // sparse array cannot be produced by this instance
        return false;
      }
      if (!this.arb.canGenerate(value[index])) {
        // item at index cannot be produced by our arbitrary
        return false;
      }
    }
    // `preFilter` only drops items, it does not reorder them or add some more
    // if calling it with `value` results into a smaller array it means that the value was not generated by this instance
    const filtered = this.preFilter(value.map((item) => new NextValue(item)));
    return filtered.length === value.length;
  }

  private shrinkImpl(value: T[], context?: unknown): Stream<[NextValue<T>[], unknown]> {
    if (value.length === 0) {
      return Stream.nil();
    }

    const safeContext: ArrayArbitraryContext =
      context !== undefined
        ? (context as ArrayArbitraryContext)
        : { shrunkOnce: false, lengthContext: undefined, itemsContexts: [] };

    return (
      this.lengthArb
        .shrink(
          value.length,
          // lengthContext is a context returned by a previous call to the integer
          // arbitrary and the integer value items.length.
          safeContext.lengthContext
        )
        // in case we already shrunk once but don't have any dedicated context to help the shrinker, we drop the first item
        // except if reached we have the minimal size +1, in that case we apply a last chance try policy
        .drop(
          safeContext.shrunkOnce && safeContext.lengthContext === undefined && value.length > this.minLength + 1 ? 1 : 0
        )
        .map((lengthValue): [NextValue<T>[], unknown] => {
          const sliceStart = value.length - lengthValue.value;
          return [
            value
              .slice(sliceStart)
              .map((v, index) => new NextValue(cloneIfNeeded(v), safeContext.itemsContexts[index + sliceStart])), // array of length lengthValue.value
            lengthValue.context, // integer context for value lengthValue.value (the length)
          ];
        })
        // Context value will be set to undefined for remaining shrinking values
        // as they are outside of our shrinking process focused on items.length.
        // None of our computed contexts will apply for them.
        .join(
          this.arb.shrink(value[0], safeContext.itemsContexts[0]).map((v) => {
            return [
              [v].concat(
                value.slice(1).map((v, index) => new NextValue(cloneIfNeeded(v), safeContext.itemsContexts[index + 1]))
              ),
              undefined, // no length context
            ];
          })
        )
        .join(
          value.length > this.minLength
            ? makeLazy(() =>
                // We pass itemsLengthContext=undefined to next shrinker to start shrinking
                // without any assumptions on the current state (we never explored that one)
                this.shrinkImpl(value.slice(1), {
                  shrunkOnce: false,
                  lengthContext: undefined,
                  itemsContexts: safeContext.itemsContexts.slice(1),
                })
                  .filter((v) => this.minLength <= v[0].length + 1)
                  .map((v): [NextValue<T>[], unknown] => {
                    return [
                      [new NextValue(cloneIfNeeded(value[0]), safeContext.itemsContexts[0])].concat(v[0]),
                      undefined,
                    ];
                  })
              )
            : Stream.nil<[NextValue<T>[], unknown]>()
        )
    );
  }

  shrink(value: T[], context?: unknown): Stream<NextValue<T[]>> {
    return this.shrinkImpl(value, context).map((contextualValue) =>
      this.wrapper(contextualValue[0], true, contextualValue[1])
    );
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
 * @remarks Since 2.4.0
 * @public
 */
export interface ArrayConstraints {
  /**
   * Lower bound of the generated array size
   * @remarks Since 2.4.0
   */
  minLength?: number;
  /**
   * Upper bound of the generated array size
   * @remarks Since 2.4.0
   */
  maxLength?: number;
}

/**
 * For arrays of values coming from `arb`
 * @param arb - Arbitrary used to generate the values inside the array
 * @remarks Since 0.0.1
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
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.1
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
 * Ease the migration with {@link https://github.com/dubzzz/fast-check/tree/main/codemods/unify-signatures | our codemod script}.
 *
 * @remarks Since 0.0.7
 * @public
 */
function array<T>(arb: Arbitrary<T>, minLength: number, maxLength: number): Arbitrary<T[]>;
/**
 * For arrays of values coming from `arb` having lower and upper bound size
 *
 * @param arb - Arbitrary used to generate the values inside the array
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 2.4.0
 * @public
 */
function array<T>(arb: Arbitrary<T>, constraints: ArrayConstraints): Arbitrary<T[]>;
function array<T>(arb: Arbitrary<T>, ...args: [] | [number] | [number, number] | [ArrayConstraints]): Arbitrary<T[]> {
  const nextArb = convertToNext(arb);
  // fc.array(arb)
  if (args[0] === undefined) return convertFromNext(new ArrayArbitrary<T>(nextArb, 0, maxLengthFromMinLength(0)));
  // fc.array(arb, constraints)
  if (typeof args[0] === 'object') {
    const minLength = args[0].minLength || 0;
    const specifiedMaxLength = args[0].maxLength;
    const maxLength = specifiedMaxLength !== undefined ? specifiedMaxLength : maxLengthFromMinLength(minLength);
    return convertFromNext(new ArrayArbitrary<T>(nextArb, minLength, maxLength));
  }
  // fc.array(arb, minLength, maxLength)
  if (args[1] !== undefined) return convertFromNext(new ArrayArbitrary<T>(nextArb, args[0], args[1]));
  // fc.array(arb, maxLength)
  return convertFromNext(new ArrayArbitrary<T>(nextArb, 0, args[0]));
}

export { array };

import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { cloneIfNeeded, cloneMethod } from '../../check/symbols';
import { integer } from '../integer';
import { makeLazy } from '../../stream/LazyIterableIterator';
import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import { CustomSetBuilder } from './interfaces/CustomSet';
import { DepthContext, DepthIdentifier, getDepthContextFor } from './helpers/DepthContext';
import { buildSlicedGenerator } from './helpers/BuildSlicedGenerator';

/** @internal */
type ArrayArbitraryContext = {
  shrunkOnce: boolean;
  lengthContext: unknown;
  itemsContexts: unknown[];
  startIndex: number;
};

/** @internal */
function biasedMaxLength(minLength: number, maxLength: number): number {
  if (minLength === maxLength) {
    return minLength;
  }
  return minLength + Math.floor(Math.log(maxLength - minLength) / Math.log(2));
}

/** @internal */
export class ArrayArbitrary<T> extends Arbitrary<T[]> {
  readonly lengthArb: Arbitrary<number>;
  readonly depthContext: DepthContext;

  constructor(
    readonly arb: Arbitrary<T>,
    readonly minLength: number,
    readonly maxGeneratedLength: number,
    readonly maxLength: number,
    depthIdentifier: DepthIdentifier | string | undefined,
    // Whenever passing a isEqual to ArrayArbitrary, you also have to filter
    // it's output just in case produced values are too small (below minLength)
    readonly setBuilder?: CustomSetBuilder<Value<T>>
  ) {
    super();
    this.lengthArb = integer({ min: minLength, max: maxGeneratedLength });
    this.depthContext = getDepthContextFor(depthIdentifier);
  }

  private preFilter(tab: Value<T>[]): Value<T>[] {
    if (this.setBuilder === undefined) {
      return tab;
    }
    const s = this.setBuilder();
    for (let index = 0; index !== tab.length; ++index) {
      s.tryAdd(tab[index]);
    }
    return s.getData();
  }

  private static makeItCloneable<T>(vs: T[], shrinkables: Value<T>[]) {
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

  private generateNItemsNoDuplicates(
    setBuilder: CustomSetBuilder<Value<T>>,
    N: number,
    mrng: Random,
    biasFactorItems: number | undefined
  ): Value<T>[] {
    let numSkippedInRow = 0;
    const s = setBuilder();
    const slicedGenerator = buildSlicedGenerator(this.arb, mrng, [], biasFactorItems);
    // Try to append into items up to the target size
    // We may reject some items as they are already part of the set
    // so we need to retry and generate other ones. In order to prevent infinite loop,
    // we accept a max of maxGeneratedLength consecutive failures. This circuit breaker may cause
    // generated to be smaller than the minimal accepted one.
    while (s.size() < N && numSkippedInRow < this.maxGeneratedLength) {
      const current = slicedGenerator.next();
      if (s.tryAdd(current)) {
        numSkippedInRow = 0;
      } else {
        numSkippedInRow += 1;
      }
    }
    return s.getData();
  }

  private safeGenerateNItemsNoDuplicates(
    setBuilder: CustomSetBuilder<Value<T>>,
    N: number,
    mrng: Random,
    biasFactorItems: number | undefined
  ): Value<T>[] {
    const depthImpact = Math.max(0, N - biasedMaxLength(this.minLength, this.maxGeneratedLength)); // no depth impact for biased lengths
    this.depthContext.depth += depthImpact; // increase depth
    try {
      return this.generateNItemsNoDuplicates(setBuilder, N, mrng, biasFactorItems);
    } finally {
      this.depthContext.depth -= depthImpact; // decrease depth (reset depth)
    }
  }

  private generateNItems(N: number, mrng: Random, biasFactorItems: number | undefined): Value<T>[] {
    const items: Value<T>[] = [];
    const slicedGenerator = buildSlicedGenerator(this.arb, mrng, [], biasFactorItems);
    slicedGenerator.attemptExact(N);
    for (let index = 0; index !== N; ++index) {
      const current = slicedGenerator.next();
      items.push(current);
    }
    return items;
  }

  private safeGenerateNItems(N: number, mrng: Random, biasFactorItems: number | undefined): Value<T>[] {
    const depthImpact = Math.max(0, N - biasedMaxLength(this.minLength, this.maxGeneratedLength)); // no depth impact for biased lengths
    this.depthContext.depth += depthImpact; // increase depth
    try {
      return this.generateNItems(N, mrng, biasFactorItems);
    } finally {
      this.depthContext.depth -= depthImpact; // decrease depth (reset depth)
    }
  }

  private wrapper(
    itemsRaw: Value<T>[],
    shrunkOnce: boolean,
    itemsRawLengthContext: unknown,
    startIndex: number
  ): Value<T[]> {
    // We need to explicitly apply filtering on shrink items
    // has they might have duplicates (on non shrunk it is not the case by construct)
    const items = shrunkOnce ? this.preFilter(itemsRaw) : itemsRaw;
    let cloneable = false;
    const vs: T[] = [];
    const itemsContexts: unknown[] = [];
    for (let idx = 0; idx !== items.length; ++idx) {
      const s = items[idx];
      cloneable = cloneable || s.hasToBeCloned;
      vs.push(s.value);
      itemsContexts.push(s.context);
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
      itemsContexts,
      startIndex,
    };
    return new Value(vs, context);
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<T[]> {
    const biasMeta = this.applyBias(mrng, biasFactor);
    const targetSize = biasMeta.size;
    const items =
      this.setBuilder !== undefined
        ? this.safeGenerateNItemsNoDuplicates(this.setBuilder, targetSize, mrng, biasMeta.biasFactorItems)
        : this.safeGenerateNItems(targetSize, mrng, biasMeta.biasFactorItems);
    return this.wrapper(items, false, undefined, 0);
  }

  private applyBias(mrng: Random, biasFactor: number | undefined): { size: number; biasFactorItems?: number } {
    if (biasFactor === undefined) {
      // We don't bias anything
      return { size: this.lengthArb.generate(mrng, undefined).value };
    }
    // We directly forward bias to items whenever no bias applicable onto length
    if (this.minLength === this.maxGeneratedLength) {
      // We only apply bias on items
      return { size: this.lengthArb.generate(mrng, undefined).value, biasFactorItems: biasFactor };
    }
    if (mrng.nextInt(1, biasFactor) !== 1) {
      // We don't bias anything
      return { size: this.lengthArb.generate(mrng, undefined).value };
    }
    // We apply bias (1 chance over biasFactor)
    if (mrng.nextInt(1, biasFactor) !== 1 || this.minLength === this.maxGeneratedLength) {
      // We only apply bias on items ((biasFactor-1) chances over biasFactor²)
      return { size: this.lengthArb.generate(mrng, undefined).value, biasFactorItems: biasFactor };
    }
    // We apply bias for both items and length (1 chance over biasFactor²)
    const maxBiasedLength = biasedMaxLength(this.minLength, this.maxGeneratedLength);
    const targetSizeValue = integer({ min: this.minLength, max: maxBiasedLength }).generate(mrng, undefined);
    return { size: targetSizeValue.value, biasFactorItems: biasFactor };
  }

  canShrinkWithoutContext(value: unknown): value is T[] {
    if (!Array.isArray(value) || this.minLength > value.length || value.length > this.maxLength) {
      return false;
    }
    for (let index = 0; index !== value.length; ++index) {
      if (!(index in value)) {
        // sparse array cannot be produced by this instance
        return false;
      }
      if (!this.arb.canShrinkWithoutContext(value[index])) {
        // item at index cannot be produced by our arbitrary
        return false;
      }
    }
    // `preFilter` only drops items, it does not reorder them or add some more
    // if calling it with `value` results into a smaller array it means that the value was not generated by this instance
    const filtered = this.preFilter(value.map((item) => new Value(item, undefined)));
    return filtered.length === value.length;
  }

  private shrinkItemByItem(
    value: T[],
    safeContext: ArrayArbitraryContext,
    endIndex: number
  ): IterableIterator<[Value<T>[], unknown, number]> {
    let shrinks = Stream.nil<[Value<T>[], unknown, number]>();
    for (let index = safeContext.startIndex; index < endIndex; ++index) {
      shrinks = shrinks.join(
        makeLazy(() =>
          this.arb.shrink(value[index], safeContext.itemsContexts[index]).map((v): [Value<T>[], unknown, number] => {
            const beforeCurrent = value
              .slice(0, index)
              .map((v, i) => new Value(cloneIfNeeded(v), safeContext.itemsContexts[i]));
            const afterCurrent = value
              .slice(index + 1)
              .map((v, i) => new Value(cloneIfNeeded(v), safeContext.itemsContexts[i + index + 1]));
            return [
              beforeCurrent.concat(v).concat(afterCurrent),
              undefined, // no length context
              index, // avoid shrinking entries before index in sub-shrinks
            ];
          })
        )
      );
    }
    return shrinks;
  }

  private shrinkImpl(value: T[], context?: unknown): Stream<[Value<T>[], unknown, number]> {
    if (value.length === 0) {
      return Stream.nil();
    }

    const safeContext: ArrayArbitraryContext =
      context !== undefined
        ? (context as ArrayArbitraryContext)
        : { shrunkOnce: false, lengthContext: undefined, itemsContexts: [], startIndex: 0 };

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
        .map((lengthValue): [Value<T>[], unknown, number] => {
          const sliceStart = value.length - lengthValue.value;
          return [
            value
              .slice(sliceStart)
              .map((v, index) => new Value(cloneIfNeeded(v), safeContext.itemsContexts[index + sliceStart])), // array of length lengthValue.value
            lengthValue.context, // integer context for value lengthValue.value (the length)
            0,
          ];
        })
        // Length context value will be set to undefined for remaining shrinking values
        // as they are outside of our shrinking process focused on items.length.
        // None of our computed contexts will apply for them.
        .join(
          makeLazy(() =>
            value.length > this.minLength
              ? this.shrinkItemByItem(value, safeContext, 1)
              : this.shrinkItemByItem(value, safeContext, value.length)
          )
        )
        .join(
          value.length > this.minLength
            ? makeLazy(() => {
                // We pass itemsLengthContext=undefined to next shrinker to start shrinking
                // without any assumptions on the current state (we never explored that one)
                const subContext: ArrayArbitraryContext = {
                  shrunkOnce: false,
                  lengthContext: undefined,
                  itemsContexts: safeContext.itemsContexts.slice(1),
                  startIndex: 0,
                };
                return this.shrinkImpl(value.slice(1), subContext)
                  .filter((v) => this.minLength <= v[0].length + 1)
                  .map((v): [Value<T>[], unknown, number] => {
                    return [
                      [new Value(cloneIfNeeded(value[0]), safeContext.itemsContexts[0])].concat(v[0]),
                      undefined,
                      0,
                    ];
                  });
              })
            : Stream.nil()
        )
    );
  }

  shrink(value: T[], context?: unknown): Stream<Value<T[]>> {
    return this.shrinkImpl(value, context).map((contextualValue) =>
      this.wrapper(contextualValue[0], true, contextualValue[1], contextualValue[2])
    );
  }
}

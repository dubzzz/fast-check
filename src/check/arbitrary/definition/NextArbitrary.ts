import { Random } from '../../../random/generator/Random';
import { Stream } from '../../../stream/Stream';
import { cloneMethod } from '../../symbols';
import { NextValue } from './NextValue';

/**
 * Abstract class able to generate values on type `T`
 *
 * @remarks Since 2.15.0
 * @public
 */
export abstract class NextArbitrary<T> {
  /**
   * Generate a value of type `T` along with its context (if any)
   * based on the provided random number generator
   *
   * @param mrng - Random number generator
   * @returns Random value of type `T` and its context
   *
   * @remarks Since 2.15.0
   */
  abstract generate(mrng: Random): NextValue<T>;

  /**
   * Check if a given value could have been generated
   * through this instance of arbitrary.
   *
   * In general, `canGenerate` is not designed to be called for each `shrink` but rather on very special cases.
   * Its usage most be restricted to `canGenerate` or in the rare* context of a `shrink` method being called without
   * any context. In this ill-formed case of `shrink`, `canGenerate` could be used or called if needed.
   *
   * *we fall in that case when fast-check is asked to shrink a value that has been provided manually by the user,
   *  in other words: a value not coming from a call to `generate` or a normal `shrink`.
   *
   * @param value - Value to be assessed
   * @returns `true` if and only if the value could have been generated by this instance
   *
   * @remarks Since 2.15.0
   */
  abstract canGenerate(value: unknown): value is T;

  /**
   * Shrink a value of type `T`, may rely on the context previously provided to shrink efficiently
   *
   * Must never be called with possibly invalid values.
   * Consider calling `canGenerate` first if you are not sure of the origin of the value.
   *
   * @param value - The value to shrink
   * @param context - Its associated context (the one returned by generate)
   * @returns Stream of shrinks for value based on context (if provided)
   *
   * @remarks Since 2.15.0
   */
  abstract shrink(value: T, context?: unknown): Stream<NextValue<T>>;

  /**
   * Create another arbitrary by filtering values against `predicate`
   *
   * All the values produced by the resulting arbitrary
   * satisfy `predicate(value) == true`
   *
   * Be aware that using filter may highly impact the time required to generate a valid entry
   *
   * @example
   * ```typescript
   * const integerGenerator: NextArbitrary<number> = ...;
   * const evenIntegerGenerator: NextArbitrary<number> = integerGenerator.filter(e => e % 2 === 0);
   * // new NextArbitrary only keeps even values
   * ```
   *
   * @param refinement - Predicate, to test each produced element. Return true to keep the element, false otherwise
   * @returns New arbitrary filtered using predicate
   *
   * @remarks Since 2.15.0
   */
  filter<U extends T>(refinement: (t: T) => t is U): NextArbitrary<U>;
  /**
   * Create another arbitrary by filtering values against `predicate`
   *
   * All the values produced by the resulting arbitrary
   * satisfy `predicate(value) == true`
   *
   * Be aware that using filter may highly impact the time required to generate a valid entry
   *
   * @example
   * ```typescript
   * const integerGenerator: NextArbitrary<number> = ...;
   * const evenIntegerGenerator: NextArbitrary<number> = integerGenerator.filter(e => e % 2 === 0);
   * // new NextArbitrary only keeps even values
   * ```
   *
   * @param predicate - Predicate, to test each produced element. Return true to keep the element, false otherwise
   * @returns New arbitrary filtered using predicate
   *
   * @remarks Since 2.15.0
   */
  filter(predicate: (t: T) => boolean): NextArbitrary<T>;
  filter<U extends T>(refinement: (t: T) => t is U): NextArbitrary<U> {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new FilterArbitrary(this, refinement);
  }

  /**
   * Create another arbitrary by mapping all produced values using the provided `mapper`
   * Values produced by the new arbitrary are the result of applying `mapper` value by value
   *
   * @example
   * ```typescript
   * const rgbChannels: NextArbitrary<{r:number,g:number,b:number}> = ...;
   * const color: NextArbitrary<string> = rgbChannels.map(ch => `#${(ch.r*65536 + ch.g*256 + ch.b).toString(16).padStart(6, '0')}`);
   * // transform an NextArbitrary producing {r,g,b} integers into an NextArbitrary of '#rrggbb'
   * ```
   *
   * @param mapper - Map function, to produce a new element based on an old one
   * @returns New arbitrary with mapped elements
   *
   * @remarks Since 2.15.0
   */
  map<U>(mapper: (t: T) => U): NextArbitrary<U> {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new MapArbitrary(this, mapper);
  }

  /**
   * Create another arbitrary by mapping a value from a base Arbirary using the provided `fmapper`
   * Values produced by the new arbitrary are the result of the arbitrary generated by applying `fmapper` to a value
   * @example
   * ```typescript
   * const arrayAndLimitArbitrary = fc.nat().chain((c: number) => fc.tuple( fc.array(fc.nat(c)), fc.constant(c)));
   * ```
   *
   * @param chainer - Chain function, to produce a new Arbitrary using a value from another Arbitrary
   * @returns New arbitrary of new type
   *
   * @remarks Since 2.15.0
   */
  chain<U>(chainer: (t: T) => NextArbitrary<U>): NextArbitrary<U> {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new ChainArbitrary(this, chainer);
  }

  /**
   * Create another NextArbitrary with no shrink values
   *
   * @example
   * ```typescript
   * const dataGenerator: NextArbitrary<string> = ...;
   * const unshrinkableDataGenerator: NextArbitrary<string> = dataGenerator.noShrink();
   * // same values no shrink
   * ```
   *
   * @returns Create another arbitrary with no shrink values
   * @remarks Since 2.15.0
   */
  noShrink(): NextArbitrary<T> {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new NoShrinkArbitrary(this);
  }

  /**
   * Create another NextArbitrary having bias - by default return itself
   *
   * @param freq - The biased version will be used one time over freq - if it exists - freq must be superior or equal to 2 to avoid any lock
   * @remarks Since 2.15.0
   */
  withBias(_freq: number): NextArbitrary<T> {
    return this;
  }

  /**
   * Create another NextArbitrary that cannot be biased
   *
   * @param freq - The biased version will be used one time over freq - if it exists
   * @remarks Since 2.15.0
   */
  noBias(): NextArbitrary<T> {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    return new NoBiasArbitrary(this);
  }
}

/** @internal */
type ChainArbitraryContext<T, U> = {
  originalValue: T;
  originalContext: unknown;
  stoppedForOriginal: boolean;
  chainedArbitrary: NextArbitrary<U>;
  chainedContext: unknown;
  clonedMrng: Random;
};

/** @internal */
class ChainArbitrary<T, U> extends NextArbitrary<U> {
  constructor(readonly arb: NextArbitrary<T>, readonly chainer: (t: T) => NextArbitrary<U>) {
    super();
  }
  generate(mrng: Random): NextValue<U> {
    const clonedMrng = mrng.clone();
    const src = this.arb.generate(mrng);
    return this.valueChainer(src, mrng, clonedMrng);
  }
  canGenerate(value: unknown): value is U {
    // TODO Need unchainer
    return false;
  }
  shrink(value: U, context?: unknown): Stream<NextValue<U>> {
    if (this.isSafeContext(context)) {
      return (!context.stoppedForOriginal
        ? this.arb
            .shrink(context.originalValue, context.originalContext)
            .map((v) => this.valueChainer(v, context.clonedMrng.clone(), context.clonedMrng))
        : Stream.nil<NextValue<U>>()
      ).join(
        context.chainedArbitrary.shrink(value, context.chainedContext).map((dst) => {
          const newContext: ChainArbitraryContext<T, U> = {
            ...context,
            chainedContext: dst.context,
            stoppedForOriginal: true,
          };
          return new NextValue(dst.value_, newContext);
        })
      );
    }
    // TODO Need unchainer
    return Stream.nil();
  }
  withBias(freq: number): NextArbitrary<U> {
    return this.arb.withBias(freq).chain((t: T) => this.chainer(t).withBias(freq));
  }
  private valueChainer(v: NextValue<T>, generateMrng: Random, clonedMrng: Random): NextValue<U> {
    const chainedArbitrary = this.chainer(v.value_);
    const dst = chainedArbitrary.generate(generateMrng);
    const context: ChainArbitraryContext<T, U> = {
      originalValue: v.value_,
      originalContext: v.context,
      stoppedForOriginal: false,
      chainedArbitrary,
      chainedContext: dst.context,
      clonedMrng,
    };
    return new NextValue(dst.value_, context);
  }
  private isSafeContext(context: unknown): context is ChainArbitraryContext<T, U> {
    return (
      context != null &&
      typeof context === 'object' &&
      'originalValue' in (context as any) &&
      'originalContext' in (context as any) &&
      'stoppedForOriginal' in (context as any) &&
      'chainedArbitrary' in (context as any) &&
      'chainedContext' in (context as any) &&
      'clonedMrng' in (context as any)
    );
  }
}

/** @internal */
type MapArbitraryContext<T> = {
  originalValue: T;
  originalContext: unknown;
};

/** @internal */
class MapArbitrary<T, U> extends NextArbitrary<U> {
  readonly bindValueMapper: (v: NextValue<T>) => NextValue<U>;
  constructor(readonly arb: NextArbitrary<T>, readonly mapper: (t: T) => U) {
    super();
    this.bindValueMapper = this.valueMapper.bind(this);
  }
  generate(mrng: Random): NextValue<U> {
    const g = this.arb.generate(mrng);
    return this.valueMapper(g);
  }
  canGenerate(value: unknown): value is U {
    // TODO Need unmapper
    return false;
  }
  shrink(value: U, context?: unknown): Stream<NextValue<U>> {
    if (this.isSafeContext(context)) {
      return this.arb.shrink(context.originalValue, context.originalContext).map(this.bindValueMapper);
    }
    // TODO Need unmapper
    return Stream.nil();
  }
  withBias(freq: number): NextArbitrary<U> {
    return this.arb.withBias(freq).map(this.mapper);
  }
  private mapperWithCloneIfNeeded(v: NextValue<T>): [U, T] {
    const sourceValue = v.value;
    const mappedValue = this.mapper(sourceValue);
    if (v.hasToBeCloned && mappedValue instanceof Object && Object.isExtensible(mappedValue)) {
      // WARNING: In case the mapped value is not extensible it will not be extended
      Object.defineProperty(mappedValue, cloneMethod, { get: () => () => this.mapperWithCloneIfNeeded(v)[0] });
    }
    return [mappedValue, sourceValue];
  }
  private valueMapper(v: NextValue<T>): NextValue<U> {
    const [mappedValue, sourceValue] = this.mapperWithCloneIfNeeded(v);
    const context: MapArbitraryContext<T> = { originalValue: sourceValue, originalContext: v.context };
    return new NextValue(mappedValue, context);
  }
  private isSafeContext(context: unknown): context is MapArbitraryContext<T> {
    return (
      context != null &&
      typeof context === 'object' &&
      'originalValue' in (context as any) &&
      'originalContext' in (context as any)
    );
  }
}

/** @internal */
class FilterArbitrary<T, U extends T> extends NextArbitrary<U> {
  readonly bindRefinementOnValue: (v: NextValue<T>) => v is NextValue<U>;
  constructor(readonly arb: NextArbitrary<T>, readonly refinement: (t: T) => t is U) {
    super();
    this.bindRefinementOnValue = this.refinementOnValue.bind(this);
  }
  generate(mrng: Random): NextValue<U> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const g = this.arb.generate(mrng);
      if (this.refinementOnValue(g)) {
        return g;
      }
    }
  }
  canGenerate(value: unknown): value is U {
    return this.arb.canGenerate(value) && this.refinement(value);
  }
  shrink(value: U, context?: unknown): Stream<NextValue<U>> {
    return this.arb.shrink(value, context).filter(this.bindRefinementOnValue);
  }
  withBias(freq: number) {
    return this.arb.withBias(freq).filter(this.refinement);
  }
  private refinementOnValue(v: NextValue<T>): v is NextValue<U> {
    return this.refinement(v.value);
  }
}

/** @internal */
class NoShrinkArbitrary<T> extends NextArbitrary<T> {
  constructor(readonly arb: NextArbitrary<T>) {
    super();
  }
  generate(mrng: Random): NextValue<T> {
    return new NextValue(this.arb.generate(mrng).value_);
  }
  canGenerate(value: unknown): value is T {
    return this.arb.canGenerate(value);
  }
  shrink(_value: T, _context?: unknown): Stream<NextValue<T>> {
    return Stream.nil();
  }
  withBias(freq: number) {
    return this.arb.withBias(freq).noShrink();
  }
}

/** @internal */
class NoBiasArbitrary<T> extends NextArbitrary<T> {
  constructor(readonly arb: NextArbitrary<T>) {
    super();
  }
  generate(mrng: Random): NextValue<T> {
    return this.arb.generate(mrng);
  }
  canGenerate(value: unknown): value is T {
    return this.arb.canGenerate(value);
  }
  shrink(value: T, context?: unknown): Stream<NextValue<T>> {
    return this.arb.shrink(value, context);
  }
}

/**
 * Ensure an instance is an isntance of NextArbitrary
 * @param instance - The instance to be checked
 * @internal
 */
export function assertIsNextArbitrary(instance: NextArbitrary<unknown>): void {
  // TODO - Ideally `: asserts instance is NextArbitrary<unknown>` but requires TS 3.7
  if (
    typeof instance !== 'object' ||
    instance === null ||
    !('generate' in instance) ||
    !('shrink' in instance) ||
    'shrinkableFor' in instance
  ) {
    throw new Error('Unexpected value received: not an instance of NextArbitrary');
  }
}

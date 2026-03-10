import type { Random } from '../random/generator/Random.js';
import { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { Value } from '../check/arbitrary/definition/Value.js';
import { Stream } from '../stream/Stream.js';

/** @internal */
type ChainUntilEntry<T> = {
  arbitrary: Arbitrary<T>;
  value: T;
  context: unknown;
  clonedMrng: Random;
};

/** @internal */
type ChainUntilArbitraryContext<T> = {
  biasFactor: number | undefined;
  entries: ChainUntilEntry<T>[];
  currentShrinkLevel: number;
};

/** @internal */
class ChainUntilArbitrary<T> extends Arbitrary<T> {
  constructor(
    readonly startArb: Arbitrary<T>,
    readonly chainer: (prev: T) => Arbitrary<T> | undefined,
  ) {
    super();
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<T> {
    const entries: ChainUntilEntry<T>[] = [];

    // Generate the first value from startArb
    const clonedMrng = mrng.clone();
    let current = this.startArb.generate(mrng, biasFactor);
    entries.push({
      arbitrary: this.startArb,
      value: current.value_,
      context: current.context,
      clonedMrng,
    });

    // Iteratively chain until chainer returns undefined
    while (true) {
      const nextArb = this.chainer(current.value_);
      if (nextArb === undefined) {
        break;
      }
      const nextClonedMrng = mrng.clone();
      current = nextArb.generate(mrng, biasFactor);
      entries.push({
        arbitrary: nextArb,
        value: current.value_,
        context: current.context,
        clonedMrng: nextClonedMrng,
      });
    }

    const ctx: ChainUntilArbitraryContext<T> = {
      biasFactor,
      entries,
      currentShrinkLevel: 0,
    };
    return new Value(current.value_, ctx);
  }

  canShrinkWithoutContext(value: unknown): value is T {
    return false;
  }

  shrink(value: T, context?: unknown): Stream<Value<T>> {
    if (!this.isSafeContext(context)) {
      return Stream.nil();
    }
    return new Stream(this.shrinkIterator(context));
  }

  private *shrinkIterator(context: ChainUntilArbitraryContext<T>): IterableIterator<Value<T>> {
    const { entries, currentShrinkLevel, biasFactor } = context;

    for (let level = currentShrinkLevel; level < entries.length; level++) {
      const entry = entries[level];
      const shrinks = entry.arbitrary.shrink(entry.value, entry.context);

      for (const shrunkValue of shrinks) {
        // Build new entries: keep entries before this level unchanged
        const newEntries: ChainUntilEntry<T>[] = entries.slice(0, level);

        // Add the shrunk entry at this level
        newEntries.push({
          arbitrary: entry.arbitrary,
          value: shrunkValue.value_,
          context: shrunkValue.context,
          clonedMrng: entry.clonedMrng,
        });

        // Regenerate subsequent entries iteratively using the cloned mrng
        let current = shrunkValue;
        const mrng = entry.clonedMrng.clone();
        while (true) {
          const nextArb = this.chainer(current.value_);
          if (nextArb === undefined) {
            break;
          }
          const nextClonedMrng = mrng.clone();
          const next = nextArb.generate(mrng, biasFactor);
          newEntries.push({
            arbitrary: nextArb,
            value: next.value_,
            context: next.context,
            clonedMrng: nextClonedMrng,
          });
          current = next;
        }

        const lastEntry = newEntries[newEntries.length - 1];
        const newContext: ChainUntilArbitraryContext<T> = {
          biasFactor,
          entries: newEntries,
          currentShrinkLevel: level,
        };
        yield new Value(lastEntry.value, newContext);
      }
    }
  }

  private isSafeContext(context: unknown): context is ChainUntilArbitraryContext<T> {
    return (
      context !== null &&
      context !== undefined &&
      typeof context === 'object' &&
      'biasFactor' in (context as any) &&
      'entries' in (context as any) &&
      'currentShrinkLevel' in (context as any)
    );
  }
}

/**
 * Build an arbitrary by iteratively chaining arbitraries until the chainer returns undefined.
 *
 * Starting from a value produced by `startArb`, the `chainer` function is called with the current value
 * to produce the next arbitrary. This process repeats until `chainer` returns `undefined`.
 * The final value in the chain is the one produced by this arbitrary.
 *
 * The implementation is fully iterative (non-recursive) and supports shrinking.
 *
 * @param startArb - The starting arbitrary producing the initial value
 * @param chainer - A function called with the current value that returns either the next arbitrary to generate from or undefined to stop the chain
 * @returns An arbitrary producing the last value in the chain
 *
 * @remarks Since 3.24.0
 * @public
 */
export function chainUntil<T>(startArb: Arbitrary<T>, chainer: (prev: T) => Arbitrary<T> | undefined): Arbitrary<T> {
  return new ChainUntilArbitrary(startArb, chainer);
}

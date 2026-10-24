import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import { Value } from '../../check/arbitrary/definition/Value.js';
import { cloneMethod } from '../../check/symbols.js';
import type { Random } from '../../random/generator/Random.js';
import { nil } from '../../utils/iterator.js';
import { asyncStringify, asyncToStringMethod, stringify, toStringMethod } from '../../utils/stringify.js';
import { array } from '../array.js';
import type { ArrayArbitraryContext } from './ArrayArbitrary.js';

type IteratorState<T> = {
  seenValues: T[];
  seenContexts: unknown[];
  mrng: Random;
  biasFactor: number | undefined;
  preBuiltLength: number;
  arrayContext: ArrayArbitraryContext | undefined;
};

// Clones share their shrinking context, but each records its own consumption.
type IteratorArbitraryContext<T> = {
  states: WeakMap<IteratorObject<T, undefined>, IteratorState<T>>;
};

function prettyPrint(numSeen: number, numTargetValues: number, seenValuesStrings?: string[]): string {
  const seenSegment =
    seenValuesStrings !== undefined
      ? `[${(numSeen === numTargetValues ? seenValuesStrings : numTargetValues === Number.POSITIVE_INFINITY ? [...seenValuesStrings, `/*…*/`] : numSeen === numTargetValues - 1 ? [...seenValuesStrings, `/*${numTargetValues - numSeen} other…*/`] : [...seenValuesStrings, `/*${numTargetValues - numSeen} others…*/`]).join(',')}]`
      : numTargetValues === Number.POSITIVE_INFINITY
        ? `/*${numSeen} emitted*/`
        : `/*${numSeen} emitted over ${numTargetValues}*/`;
  return `Iterator.from(${seenSegment})`;
}

export class IteratorArbitrary<T> extends Arbitrary<IteratorObject<T, undefined>> {
  constructor(
    readonly arb: Arbitrary<T>,
    readonly history: boolean,
    readonly minLength: number,
    readonly maxGeneratedLength: number,
    readonly maxLength: number,
  ) {
    super();
  }

  private drawTargetLength(mrng: Random): number {
    const minLength = this.minLength;
    if (minLength === Number.POSITIVE_INFINITY) {
      // Only never-ending iterators can be produced
      return Number.POSITIVE_INFINITY;
    }
    if (this.maxLength === Number.POSITIVE_INFINITY) {
      // One extra slot on top of the usual finite range: reaching it means never-ending iterator
      // WARNING: maxGeneratedLength MUST always be a finite value when minLength !== +infinity
      const drawn = mrng.nextInt(minLength - 1, this.maxGeneratedLength);
      return drawn < minLength ? Number.POSITIVE_INFINITY : drawn;
    }
    return mrng.nextInt(minLength, this.maxGeneratedLength);
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<IteratorObject<T, undefined>> {
    const appliedBiasFactor = biasFactor !== undefined && mrng.nextInt(1, biasFactor) === 1 ? biasFactor : undefined;
    const targetLength = this.drawTargetLength(mrng);
    return this.wrapper(mrng, appliedBiasFactor, targetLength);
  }

  private wrapper(
    mrng: Random,
    biasFactor: number | undefined,
    targetLength: number,
    preBuilt?: Value<T[]>,
  ): Value<IteratorObject<T, undefined>> {
    const context: IteratorArbitraryContext<T> | undefined = this.history ? { states: new WeakMap() } : undefined;
    const enrichedProducer = () => {
      const seenValues: T[] | null = this.history ? [] : null;
      const seenContexts: unknown[] = [];
      const preBuiltValues = preBuilt !== undefined ? preBuilt.value : [];
      const arrayContext = preBuilt !== undefined ? (preBuilt.context as ArrayArbitraryContext) : undefined;
      const clonedMrng = mrng.clone();
      let numSeenValues = 0;
      const g = function* (arb: Arbitrary<T>, clonedMrng: Random): IteratorObject<T, undefined> {
        for (let numYields = 0; numYields < targetLength; ++numYields) {
          const item =
            numYields < preBuiltValues.length
              ? new Value(preBuiltValues[numYields], arrayContext?.itemsContexts[numYields])
              : arb.generate(clonedMrng, biasFactor);
          const value = item.value;
          numSeenValues++;
          if (seenValues !== null) {
            seenValues.push(value);
            seenContexts.push(item.context);
          }
          yield value;
        }
      };
      const s = g(this.arb, clonedMrng);
      if (context !== undefined && seenValues !== null) {
        context.states.set(s, {
          seenValues,
          seenContexts,
          mrng: clonedMrng,
          biasFactor,
          preBuiltLength: preBuiltValues.length,
          arrayContext,
        });
      }
      return Object.defineProperties(s, {
        toString: {
          value: () =>
            prettyPrint(numSeenValues, targetLength, seenValues !== null ? seenValues.map(stringify) : undefined),
        },
        [toStringMethod]: {
          value: () =>
            prettyPrint(numSeenValues, targetLength, seenValues !== null ? seenValues.map(stringify) : undefined),
        },
        [asyncToStringMethod]: {
          value: async () =>
            prettyPrint(
              numSeenValues,
              targetLength,
              seenValues !== null ? await Promise.all(seenValues.map(asyncStringify)) : undefined,
            ),
        },
        // We allow reconfiguration of the [cloneMethod] as caller might want to enforce its own
        [cloneMethod]: { value: enrichedProducer, enumerable: true },
      });
    };
    return new Value(enrichedProducer(), context);
  }

  canShrinkWithoutContext(_value: unknown): _value is IteratorObject<T, undefined> {
    // Knowing if we can generate or not an infinite iterator would require to iterate over it
    // (until its "end")
    return false;
  }

  shrink(value: IteratorObject<T, undefined>, context?: unknown): IteratorObject<Value<IteratorObject<T, undefined>>> {
    if (context === undefined) {
      return nil;
    }
    const safeContext = context as IteratorArbitraryContext<T>;
    const state = safeContext.states.get(value);
    if (state === undefined) {
      return nil;
    }
    if (state.seenValues.length === 0) {
      return nil;
    }
    const seenValues = state.seenValues.slice();
    const arrayContext: ArrayArbitraryContext = {
      // A different number of consumed items invalidates the previous array's length and index hints.
      ...(seenValues.length === state.preBuiltLength && state.arrayContext !== undefined
        ? state.arrayContext
        : { shrunkOnce: false, lengthContext: undefined, startIndex: 0 }),
      itemsContexts: state.seenContexts.slice(),
    };
    const arrayArb = array(this.arb, {
      minLength: Math.min(this.minLength, seenValues.length),
      maxLength: seenValues.length,
    });
    const mrng = state.mrng.clone();
    return arrayArb.shrink(seenValues, arrayContext).map((shrunk) =>
      // An unconsumed suffix is only kept when required by minLength (including +infinity).
      // It remains lazy and starts at the random state following the consumed prefix.
      this.wrapper(mrng, state.biasFactor, Math.max(this.minLength, shrunk.value_.length), shrunk),
    );
  }
}

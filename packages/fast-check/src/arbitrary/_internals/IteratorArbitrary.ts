import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import { Value } from '../../check/arbitrary/definition/Value.js';
import { cloneMethod } from '../../check/symbols.js';
import type { Random } from '../../random/generator/Random.js';
import { nil } from '../../utils/iterator.js';
import { asyncStringify, asyncToStringMethod, stringify, toStringMethod } from '../../utils/stringify.js';

/** @internal */
function prettyPrint(numSeen: number, numTargetValues: number, seenValuesStrings?: string[]): string {
  const seenSegment =
    seenValuesStrings !== undefined
      ? `[${(numSeen === numTargetValues ? seenValuesStrings : numTargetValues === Number.POSITIVE_INFINITY ? [...seenValuesStrings, `/*…*/`] : numSeen === numTargetValues - 1 ? [...seenValuesStrings, `/*${numTargetValues - numSeen} other…*/`] : [...seenValuesStrings, `/*${numTargetValues - numSeen} others…*/`]).join(',')}]`
      : numTargetValues === Number.POSITIVE_INFINITY
        ? `/*${numSeen} emitted*/`
        : `/*${numSeen} emitted over ${numTargetValues}*/`;
  return `Iterator.from(${seenSegment})`;
}

/** @internal */
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
    const enrichedProducer = () => {
      const seenValues: T[] | null = this.history ? [] : null;
      let numSeenValues = 0;
      const g = function* (arb: Arbitrary<T>, clonedMrng: Random): IteratorObject<T, undefined> {
        for (let numYields = 0; numYields < targetLength; ++numYields) {
          const value = arb.generate(clonedMrng, appliedBiasFactor).value;
          numSeenValues++;
          if (seenValues !== null) {
            seenValues.push(value);
          }
          yield value;
        }
      };
      const s = g(this.arb, mrng.clone());
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
    return new Value(enrichedProducer(), undefined);
  }

  canShrinkWithoutContext(_value: unknown): _value is IteratorObject<T, undefined> {
    // Knowing if we can generate or not an infinite iterator would require to iterate over it
    // (until its "end")
    return false;
  }

  shrink(
    _value: IteratorObject<T, undefined>,
    _context?: unknown,
  ): IteratorObject<Value<IteratorObject<T, undefined>>> {
    // Not supported yet, even if context was provided
    return nil;
  }
}

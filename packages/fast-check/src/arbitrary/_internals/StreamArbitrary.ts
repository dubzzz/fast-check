import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import { Value } from '../../check/arbitrary/definition/Value.js';
import { cloneMethod } from '../../check/symbols.js';
import type { Random } from '../../random/generator/Random.js';
import { nil } from '../../utils/iterator.js';
import { asyncStringify, asyncToStringMethod, stringify, toStringMethod } from '../../utils/stringify.js';

/** @internal */
function prettyPrint(numSeen: number, seenValuesStrings?: string[]): string {
  const seenSegment = seenValuesStrings !== undefined ? `${seenValuesStrings.join(',')}…` : `${numSeen} emitted`;
  return `Stream(${seenSegment})`;
}

/** @internal */
export class StreamArbitrary<T> extends Arbitrary<IteratorObject<T, never>> {
  constructor(
    readonly arb: Arbitrary<T>,
    readonly history: boolean,
  ) {
    super();
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<IteratorObject<T, never>> {
    const appliedBiasFactor = biasFactor !== undefined && mrng.nextInt(1, biasFactor) === 1 ? biasFactor : undefined;
    const enrichedProducer = () => {
      const seenValues: T[] | null = this.history ? [] : null;
      let numSeenValues = 0;
      const g = function* (arb: Arbitrary<T>, clonedMrng: Random): IteratorObject<T, never> {
        while (true) {
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
          value: () => prettyPrint(numSeenValues, seenValues !== null ? seenValues.map(stringify) : undefined),
        },
        [toStringMethod]: {
          value: () => prettyPrint(numSeenValues, seenValues !== null ? seenValues.map(stringify) : undefined),
        },
        [asyncToStringMethod]: {
          value: async () =>
            prettyPrint(
              numSeenValues,
              seenValues !== null ? await Promise.all(seenValues.map(asyncStringify)) : undefined,
            ),
        },
        // We allow reconfiguration of the [cloneMethod] as caller might want to enforce its own
        [cloneMethod]: { value: enrichedProducer, enumerable: true },
      });
    };
    return new Value(enrichedProducer(), undefined);
  }

  canShrinkWithoutContext(_value: unknown): _value is IteratorObject<T, never> {
    // Knowing if we can generate or not an infinite stream would require to iterate over it
    // (until its "end")
    return false;
  }

  shrink(_value: IteratorObject<T, never>, _context?: unknown): IteratorObject<Value<IteratorObject<T, never>>> {
    // Not supported yet, even if context was provided
    return nil;
  }
}

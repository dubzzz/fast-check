import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import { cloneMethod } from '../../check/symbols';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { safeJoin, safePush } from '../../utils/globals';
import { asyncStringify, asyncToStringMethod, stringify, toStringMethod } from '../../utils/stringify';

const safeObjectDefineProperties = Object.defineProperties;

/** @internal */
function prettyPrint(seenValuesStrings: string[]): string {
  return `Stream(${safeJoin(seenValuesStrings, ',')}…)`;
}

/** @internal */
export class StreamArbitrary<T> extends Arbitrary<Stream<T>> {
  constructor(readonly arb: Arbitrary<T>) {
    super();
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<Stream<T>> {
    const appliedBiasFactor = biasFactor !== undefined && mrng.nextInt(1, biasFactor) === 1 ? biasFactor : undefined;
    const enrichedProducer = () => {
      const seenValues: T[] = [];
      const g = function* (arb: Arbitrary<T>, clonedMrng: Random) {
        while (true) {
          const value = arb.generate(clonedMrng, appliedBiasFactor).value;
          safePush(seenValues, value);
          yield value;
        }
      };
      const s = new Stream(g(this.arb, mrng.clone()));
      return safeObjectDefineProperties(s, {
        toString: { value: () => prettyPrint(seenValues.map(stringify)) },
        [toStringMethod]: { value: () => prettyPrint(seenValues.map(stringify)) },
        [asyncToStringMethod]: { value: async () => prettyPrint(await Promise.all(seenValues.map(asyncStringify))) },
        // We allow reconfiguration of the [cloneMethod] as caller might want to enforce its own
        [cloneMethod]: { value: enrichedProducer, enumerable: true },
      });
    };
    return new Value(enrichedProducer(), undefined);
  }

  canShrinkWithoutContext(value: unknown): value is Stream<T> {
    // Knowing if we can generate or not an infinite stream would require to iterate over it
    // (until its "end")
    return false;
  }

  shrink(_value: Stream<T>, _context?: unknown): Stream<Value<Stream<T>>> {
    // Not supported yet, even if context was provided
    return Stream.nil();
  }
}

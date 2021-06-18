import { NextArbitrary } from '../../check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../check/arbitrary/definition/NextValue';
import { cloneMethod } from '../../check/symbols';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { asyncStringify, asyncToStringMethod, stringify, toStringMethod } from '../../utils/stringify';

/** @internal */
function prettyPrint(seenValuesStrings: string[]): string {
  return `Stream(${seenValuesStrings.join(',')}…)`;
}

/** @internal */
export class StreamArbitrary<T> extends NextArbitrary<Stream<T>> {
  constructor(readonly arb: NextArbitrary<T>) {
    super();
  }

  generate(mrng: Random, biasFactor: number | undefined): NextValue<Stream<T>> {
    const appliedBiasFactor = biasFactor !== undefined && mrng.nextInt(1, biasFactor) === 1 ? biasFactor : undefined;
    const enrichedProducer = () => {
      const seenValues: T[] = [];
      const g = function* (arb: NextArbitrary<T>, clonedMrng: Random) {
        while (true) {
          const value = arb.generate(clonedMrng, appliedBiasFactor).value;
          seenValues.push(value);
          yield value;
        }
      };
      const s = new Stream(g(this.arb, mrng.clone()));
      return Object.defineProperties(s, {
        toString: { value: () => prettyPrint(seenValues.map(stringify)) },
        [toStringMethod]: { value: () => prettyPrint(seenValues.map(stringify)) },
        [asyncToStringMethod]: { value: async () => prettyPrint(await Promise.all(seenValues.map(asyncStringify))) },
        [cloneMethod]: { value: enrichedProducer },
      });
    };
    return new NextValue(enrichedProducer(), undefined);
  }

  canShrinkWithoutContext(value: unknown): value is Stream<T> {
    // Knowing if we can generate or not an infinite stream would require to iterate over it
    // (until its "end")
    return false;
  }

  shrink(_value: Stream<T>, _context?: unknown): Stream<NextValue<Stream<T>>> {
    // Not supported yet, even if context was provided
    return Stream.nil();
  }
}

import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { stringify } from '../../utils/stringify';
import { cloneMethod } from '../symbols';
import { Arbitrary } from './definition/Arbitrary';
import { convertFromNext, convertToNext } from './definition/Converters';
import { NextArbitrary } from './definition/NextArbitrary';
import { NextValue } from './definition/NextValue';

/** @internal */
class StreamArbitrary<T> extends NextArbitrary<Stream<T>> {
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
          yield value;
          seenValues.push(value);
        }
      };
      const s = new Stream(g(this.arb, mrng.clone()));
      const toString = () => `Stream(${seenValues.map(stringify).join(',')}…)`;
      return Object.assign(s, { toString, [cloneMethod]: enrichedProducer });
    };
    return new NextValue(enrichedProducer());
  }

  canGenerate(value: unknown): value is Stream<T> {
    // Knowing if we can generate or not an infinite stream would require to iterate over it
    // (until its "end")
    return false;
  }

  shrink(_value: Stream<T>, _context?: unknown): Stream<NextValue<Stream<T>>> {
    // Not supported yet, even if context was provided
    return Stream.nil();
  }
}

/**
 * Produce an infinite stream of values
 *
 * WARNING: Requires Object.assign
 *
 * @param arb - Arbitrary used to generate the values
 *
 * @remarks Since 1.8.0
 * @public
 */
function infiniteStream<T>(arb: Arbitrary<T>): Arbitrary<Stream<T>> {
  return convertFromNext(new StreamArbitrary(convertToNext(arb)));
}

export { infiniteStream };

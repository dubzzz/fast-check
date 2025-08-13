import type { Stream } from '../stream/Stream';
import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { StreamArbitrary } from './_internals/StreamArbitrary';

/**
 * Produce an infinite stream of values
 *
 * WARNING: By default, infiniteStream remembers all values it has ever
 * generated. This causes unbounded memory growth during large tests.
 * Set history=false to disable.
 *
 * WARNING: Requires Object.assign
 *
 * @param arb - Arbitrary used to generate the values
 * @param history - Whether to remember generated values (since 4.3.0)
 *
 * @remarks Since 1.8.0
 * @public
 */
function infiniteStream<T>(arb: Arbitrary<T>, history: boolean = true): Arbitrary<Stream<T>> {
  return new StreamArbitrary(arb, history);
}

export { infiniteStream };

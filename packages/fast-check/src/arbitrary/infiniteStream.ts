import type { Stream } from '../stream/Stream';
import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { StreamArbitrary } from './_internals/StreamArbitrary';

/**
 * Constraints to be applied on {@link infiniteStream}
 * @remarks Since 4.3.0
 * @public
 */
interface InfiniteStreamConstraints {

  /**
   * Do not save items emitted by this arbitrary and print count instead.
   * Recommended for very large tests.
   *
   * @defaultValue false
   */
  noHistory?: boolean;
}

/**
 * Produce an infinite stream of values
 *
 * WARNING: By default, infiniteStream remembers all values it has ever
 * generated. This causes unbounded memory growth during large tests.
 * Set noHistory to disable.
 *
 * WARNING: Requires Object.assign
 *
 * @param arb - Arbitrary used to generate the values
 * @param constraints - Constraints to apply when building instances (since 4.3.0)
 *
 * @remarks Since 1.8.0
 * @public
 */
function infiniteStream<T>(arb: Arbitrary<T>, constraints?: InfiniteStreamConstraints): Arbitrary<Stream<T>> {

  return new StreamArbitrary(arb, !(constraints?.noHistory ?? false));
}

export { infiniteStream };

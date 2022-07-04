import { Value } from '../../../check/arbitrary/definition/Value';

/**
 * Internal helper responsible to fallback from time to time to already pre-computed entries
 * provided by the caller and referred as slices
 * @internal
 */
export type SlicedGenerator<T> = {
  /**
   * Warm-up the generator with an idea of the exact size.
   * It may be used by the generator to favor some values (the ones with the right length) instead of others.
   * @internal
   */
  attemptExact: (targetLength: number) => void;
  /**
   * Compute the next generated value
   * @internal
   */
  next: () => Value<T>;
};

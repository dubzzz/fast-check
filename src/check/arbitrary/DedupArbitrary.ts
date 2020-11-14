import { clone, CloneValue } from './CloneArbitrary';

/**
 * @deprecated Switch to {@link CloneValue} instead
 * @public
 */
export type DedupValue<T, N extends number> = CloneValue<T, N>;

/**
 * @deprecated Switch to {@link clone} instead
 * @public
 */
export const dedup = clone;

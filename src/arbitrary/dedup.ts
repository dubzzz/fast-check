import { clone, CloneValue } from './clone';

/**
 * @deprecated Switch to {@link CloneValue} instead
 * @remarks Since 2.2.0
 * @public
 */
export type DedupValue<T, N extends number> = CloneValue<T, N>;

/**
 * @deprecated Switch to {@link clone} instead
 * @remarks Since 1.11.0
 * @public
 */
export const dedup = clone;

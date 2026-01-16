import type { Arbitrary } from '../check/arbitrary/definition/Arbitrary.js';
import { integer } from './integer.js';
import { noBias } from './noBias.js';

/** @internal */
function booleanMapper(v: number): boolean {
  return v === 1;
}

/** @internal */
function booleanUnmapper(v: unknown): number {
  return (v as boolean) === true ? 1 : 0;
}

/**
 * For boolean values - `true` or `false`
 * @remarks Since 0.0.6
 * @public
 */
function boolean(): Arbitrary<boolean> {
  return noBias(integer({ min: 0, max: 1 }).map(booleanMapper, booleanUnmapper));
}

export { boolean };

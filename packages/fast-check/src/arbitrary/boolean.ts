import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { integer } from './integer';

/** @internal */
function booleanMapper(v: number): boolean {
  return v === 1;
}

/** @internal */
function booleanUnmapper(v: unknown): number {
  if (typeof v !== 'boolean') throw new Error('Unsupported input type');
  return v === true ? 1 : 0;
}

/**
 * For boolean values - `true` or `false`
 * @remarks Since 0.0.6
 * @public
 */
function boolean(): Arbitrary<boolean> {
  return integer({ min: 0, max: 1 }).map(booleanMapper, booleanUnmapper).noBias();
}

export { boolean };

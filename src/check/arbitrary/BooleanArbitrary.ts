import { Arbitrary } from './definition/Arbitrary';
import { integer } from '../../arbitrary/integer';

/**
 * For boolean values - `true` or `false`
 * @remarks Since 0.0.6
 * @public
 */
function boolean(): Arbitrary<boolean> {
  return integer(0, 1)
    .map((v) => v === 1)
    .noBias();
}

export { boolean };

import { Arbitrary } from './definition/Arbitrary';
import { integer } from './IntegerArbitrary';

/**
 * For boolean values - `true` or `false`
 * @public
 */
function boolean(): Arbitrary<boolean> {
  return integer(0, 1)
    .map((v) => v === 1)
    .noBias();
}

export { boolean };

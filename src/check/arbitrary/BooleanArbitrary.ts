import Arbitrary from './definition/Arbitrary';
import { integer } from './IntegerArbitrary';

/**
 * Arbitrary producing either true or false
 */
function boolean(): Arbitrary<boolean> {
  return integer(0, 1).map(v => v === 1);
}

export { boolean };

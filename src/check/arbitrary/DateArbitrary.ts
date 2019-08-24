import { Arbitrary } from './definition/Arbitrary';
import { integer } from './IntegerArbitrary';

/**
 * For date between constraints.min or new Date(-8640000000000000) (included) and constraints.max or new Date(8640000000000000) (included)
 *  
 * @param constraints
 */
export function date(constraints?: { min?: Date; max?: Date }): Arbitrary<Date> {
  // Date min and max in ECMAScript specification : https://stackoverflow.com/a/11526569/3707828
  let intMin = -8640000000000000;
  let intMax = 8640000000000000;
  if (constraints !== undefined) {
    if (constraints.min !== undefined) intMin = constraints.min.getTime();
    if (constraints.max !== undefined) intMax = constraints.max.getTime();
  }
  if (intMin > intMax) throw new Error('fc.date maximum value should be equal or greater than the minimum one');
  return integer(intMin, intMax).map(a => new Date(a));
}

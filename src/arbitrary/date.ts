import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { integer } from './integer';

/**
 * For date between constraints.min or new Date(-8640000000000000) (included) and constraints.max or new Date(8640000000000000) (included)
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 1.17.0
 * @public
 */
export function date(constraints?: { min?: Date; max?: Date }): Arbitrary<Date> {
  // Date min and max in ECMAScript specification : https://stackoverflow.com/a/11526569/3707828
  const intMin = constraints && constraints.min !== undefined ? constraints.min.getTime() : -8640000000000000;
  const intMax = constraints && constraints.max !== undefined ? constraints.max.getTime() : 8640000000000000;
  if (Number.isNaN(intMin)) throw new Error('fc.date min must be valid instance of Date');
  if (Number.isNaN(intMax)) throw new Error('fc.date max must be valid instance of Date');
  if (intMin > intMax) throw new Error('fc.date max must be greater or equal to min');
  return integer(intMin, intMax).map((a) => new Date(a));
}

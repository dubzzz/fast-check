import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { safeGetTime } from '../utils/globals';
import { integer } from './integer';
import { timeToDateMapper, timeToDateUnmapper } from './_internals/mappers/TimeToDate';

const safeNumberIsNaN = Number.isNaN;

/**
 * Constraints to be applied on {@link date}
 * @remarks Since 3.3.0
 * @public
 */
export interface DateConstraints {
  /**
   * Lower bound of the range (included)
   * @defaultValue new Date(-8640000000000000)
   * @remarks Since 1.17.0
   */
  min?: Date;
  /**
   * Upper bound of the range (included)
   * @defaultValue new Date(8640000000000000)
   * @remarks Since 1.17.0
   */
  max?: Date;
}

/**
 * For date between constraints.min or new Date(-8640000000000000) (included) and constraints.max or new Date(8640000000000000) (included)
 *
 * @param constraints - Constraints to apply when building instances
 *
 * @remarks Since 1.17.0
 * @public
 */
export function date(constraints?: DateConstraints): Arbitrary<Date> {
  // Date min and max in ECMAScript specification : https://stackoverflow.com/a/11526569/3707828
  const intMin = constraints && constraints.min !== undefined ? safeGetTime(constraints.min) : -8640000000000000;
  const intMax = constraints && constraints.max !== undefined ? safeGetTime(constraints.max) : 8640000000000000;
  if (safeNumberIsNaN(intMin)) throw new Error('fc.date min must be valid instance of Date');
  if (safeNumberIsNaN(intMax)) throw new Error('fc.date max must be valid instance of Date');
  if (intMin > intMax) throw new Error('fc.date max must be greater or equal to min');
  return integer({ min: intMin, max: intMax }).map(timeToDateMapper, timeToDateUnmapper);
}

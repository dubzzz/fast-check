import type { IRawProperty } from '../property/IRawProperty.js';
import { SkipAfterProperty } from '../property/SkipAfterProperty.js';
import { TimeoutProperty } from '../property/TimeoutProperty.js';
import { UnbiasedProperty } from '../property/UnbiasedProperty.js';
import type { QualifiedParameters } from './configuration/QualifiedParameters.js';
import { IgnoreEqualValuesProperty } from '../property/IgnoreEqualValuesProperty.js';


/** @internal */
type MinimalQualifiedParameters<Ts> = Pick<
  QualifiedParameters<Ts>,
  'unbiased' | 'timeout' | 'skipAllAfterTimeLimit' | 'interruptAfterTimeLimit' | 'skipEqualValues' | 'ignoreEqualValues'
>;

/** @internal */
export function decorateProperty<Ts>(
  rawProperty: IRawProperty<Ts>,
  qParams: MinimalQualifiedParameters<Ts>,
): IRawProperty<Ts> {
  let prop = rawProperty;
  if (rawProperty.isAsync() && qParams.timeout !== undefined) {
    prop = new TimeoutProperty(prop, qParams.timeout, setTimeout, clearTimeout);
  }
  if (qParams.unbiased) {
    prop = new UnbiasedProperty(prop);
  }
  if (qParams.skipAllAfterTimeLimit !== undefined) {
    prop = new SkipAfterProperty(
      prop,
      Date.now,
      qParams.skipAllAfterTimeLimit,
      false,
      setTimeout,
      clearTimeout,
    );
  }
  if (qParams.interruptAfterTimeLimit !== undefined) {
    prop = new SkipAfterProperty(
      prop,
      Date.now,
      qParams.interruptAfterTimeLimit,
      true,
      setTimeout,
      clearTimeout,
    );
  }
  if (qParams.skipEqualValues) {
    prop = new IgnoreEqualValuesProperty(prop, true);
  }
  if (qParams.ignoreEqualValues) {
    prop = new IgnoreEqualValuesProperty(prop, false);
  }
  return prop;
}

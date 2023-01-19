import { IRawProperty } from '../property/IRawProperty';
import { SkipAfterProperty } from '../property/SkipAfterProperty';
import { TimeoutProperty } from '../property/TimeoutProperty';
import { UnbiasedProperty } from '../property/UnbiasedProperty';
import { QualifiedParameters } from './configuration/QualifiedParameters';
import { IgnoreEqualValuesProperty } from '../property/IgnoreEqualValuesProperty';

const safeDateNow = Date.now;

/** @internal */
type MinimalQualifiedParameters<Ts> = Pick<
  QualifiedParameters<Ts>,
  'unbiased' | 'timeout' | 'skipAllAfterTimeLimit' | 'interruptAfterTimeLimit' | 'skipEqualValues' | 'ignoreEqualValues'
>;

/** @internal */
export function decorateProperty<Ts>(
  rawProperty: IRawProperty<Ts>,
  qParams: MinimalQualifiedParameters<Ts>
): IRawProperty<Ts> {
  let prop = rawProperty;
  if (rawProperty.isAsync() && qParams.timeout != null) {
    prop = new TimeoutProperty(prop, qParams.timeout, safeSetTimeout, safeClearTimeout);
  }
  if (qParams.unbiased) {
    prop = new UnbiasedProperty(prop);
  }
  if (qParams.skipAllAfterTimeLimit != null) {
    prop = new SkipAfterProperty(prop, safeDateNow, qParams.skipAllAfterTimeLimit, false);
  }
  if (qParams.interruptAfterTimeLimit != null) {
    prop = new SkipAfterProperty(prop, safeDateNow, qParams.interruptAfterTimeLimit, true);
  }
  if (qParams.skipEqualValues) {
    prop = new IgnoreEqualValuesProperty(prop, true);
  }
  if (qParams.ignoreEqualValues) {
    prop = new IgnoreEqualValuesProperty(prop, false);
  }
  return prop;
}

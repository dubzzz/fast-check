import { IRawProperty } from '../property/IRawProperty';
import { SkipAfterProperty } from '../property/SkipAfterProperty';
import { TimeoutProperty } from '../property/TimeoutProperty';
import { UnbiasedProperty } from '../property/UnbiasedProperty';
import { QualifiedParameters } from './configuration/QualifiedParameters';
import { IgnoreEqualValuesProperty } from '../property/IgnoreEqualValuesProperty';
import { convertFromNextProperty, convertToNextProperty } from '../property/ConvertersProperty';

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
    prop = new TimeoutProperty(prop, qParams.timeout);
  }
  if (qParams.unbiased) {
    prop = convertFromNextProperty(new UnbiasedProperty(convertToNextProperty(prop)));
  }
  if (qParams.skipAllAfterTimeLimit != null) {
    prop = new SkipAfterProperty(prop, Date.now, qParams.skipAllAfterTimeLimit, false);
  }
  if (qParams.interruptAfterTimeLimit != null) {
    prop = new SkipAfterProperty(prop, Date.now, qParams.interruptAfterTimeLimit, true);
  }
  if (qParams.skipEqualValues) {
    prop = convertFromNextProperty(new IgnoreEqualValuesProperty(convertToNextProperty(prop), true));
  }
  if (qParams.ignoreEqualValues) {
    prop = convertFromNextProperty(new IgnoreEqualValuesProperty(convertToNextProperty(prop), false));
  }
  return prop;
}

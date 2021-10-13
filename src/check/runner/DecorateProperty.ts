import { IRawProperty } from '../property/IRawProperty';
import { SkipAfterProperty } from '../property/SkipAfterProperty';
import { TimeoutProperty } from '../property/TimeoutProperty';
import { UnbiasedProperty } from '../property/UnbiasedProperty';
import { QualifiedParameters } from './configuration/QualifiedParameters';
import { IgnoreEqualValuesProperty } from '../property/IgnoreEqualValuesProperty';
import { convertToNextProperty } from '../property/ConvertersProperty';
import { INextRawProperty } from '../property/INextRawProperty';

/** @internal */
type MinimalQualifiedParameters<Ts> = Pick<
  QualifiedParameters<Ts>,
  'unbiased' | 'timeout' | 'skipAllAfterTimeLimit' | 'interruptAfterTimeLimit' | 'skipEqualValues' | 'ignoreEqualValues'
>;

/** @internal */
export function decorateProperty<Ts>(
  rawProperty: IRawProperty<Ts>,
  qParams: MinimalQualifiedParameters<Ts>
): INextRawProperty<Ts> {
  let prop = convertToNextProperty(rawProperty);
  if (rawProperty.isAsync() && qParams.timeout != null) {
    prop = new TimeoutProperty(prop, qParams.timeout);
  }
  if (qParams.unbiased) {
    prop = new UnbiasedProperty(prop);
  }
  if (qParams.skipAllAfterTimeLimit != null) {
    prop = new SkipAfterProperty(prop, Date.now, qParams.skipAllAfterTimeLimit, false);
  }
  if (qParams.interruptAfterTimeLimit != null) {
    prop = new SkipAfterProperty(prop, Date.now, qParams.interruptAfterTimeLimit, true);
  }
  if (qParams.skipEqualValues) {
    prop = new IgnoreEqualValuesProperty(prop, true);
  }
  if (qParams.ignoreEqualValues) {
    prop = new IgnoreEqualValuesProperty(prop, false);
  }
  return prop;
}

import { IRawProperty } from '../property/IRawProperty';
import { SkipAfterProperty } from '../property/SkipAfterProperty';
import { TimeoutProperty } from '../property/TimeoutProperty';
import { UnbiasedProperty } from '../property/UnbiasedProperty';
import { QualifiedParameters } from './configuration/QualifiedParameters';

/** @internal */
type MinimalQualifiedParameters<Ts> = Pick<
  QualifiedParameters<Ts>,
  'unbiased' | 'timeout' | 'skipAllAfterTimeLimit' | 'interruptAfterTimeLimit'
>;

/** @internal */
export function decorateProperty<Ts>(rawProperty: IRawProperty<Ts>, qParams: MinimalQualifiedParameters<Ts>) {
  let prop = rawProperty;
  if (rawProperty.isAsync() && qParams.timeout != null) prop = new TimeoutProperty(prop, qParams.timeout);
  if (qParams.unbiased === true) prop = new UnbiasedProperty(prop);
  if (qParams.skipAllAfterTimeLimit != null)
    prop = new SkipAfterProperty(prop, Date.now, qParams.skipAllAfterTimeLimit, false);
  if (qParams.interruptAfterTimeLimit != null)
    prop = new SkipAfterProperty(prop, Date.now, qParams.interruptAfterTimeLimit, true);
  return prop;
}

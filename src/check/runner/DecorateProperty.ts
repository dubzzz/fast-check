import { IProperty } from '../property/IProperty';
import { SkipAfterProperty } from '../property/SkipAfterProperty';
import { TimeoutProperty } from '../property/TimeoutProperty';
import { UnbiasedProperty } from '../property/UnbiasedProperty';
import { QualifiedParameters } from './configuration/QualifiedParameters';

/** @hidden */
type MinimalQualifiedParameters<Ts> = Pick<QualifiedParameters<Ts>, 'unbiased' | 'timeout' | 'skipAllAfterTimeLimit'>;

/** @hidden */
export function decorateProperty<Ts>(rawProperty: IProperty<Ts>, qParams: MinimalQualifiedParameters<Ts>) {
  let prop = rawProperty;
  if (rawProperty.isAsync() && qParams.timeout != null) prop = new TimeoutProperty(prop, qParams.timeout);
  if (qParams.unbiased === true) prop = new UnbiasedProperty(prop);
  if (qParams.skipAllAfterTimeLimit != null)
    prop = new SkipAfterProperty(prop, Date.now, qParams.skipAllAfterTimeLimit);
  return prop;
}

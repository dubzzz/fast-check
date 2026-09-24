import type { Property } from '../property/types/Property.js';
import { TimeoutProperty } from '../property/plugins/TimeoutProperty.js';
import type { QualifiedParameters } from './configuration/QualifiedParameters.js';

// This helper MUST capture the following globals to avoid test runners to mock our internals and defeat us
const safeSetTimeout = setTimeout;
const safeClearTimeout = clearTimeout;

type MinimalQualifiedParameters<Ts> = Pick<QualifiedParameters<Ts>, 'timeout'>;

export function decorateProperty<Ts>(rawProperty: Property<Ts>, qParams: MinimalQualifiedParameters<Ts>): Property<Ts> {
  let prop = rawProperty;
  if (qParams.timeout !== undefined) {
    prop = new TimeoutProperty(prop, qParams.timeout, safeSetTimeout, safeClearTimeout);
  }
  return prop;
}

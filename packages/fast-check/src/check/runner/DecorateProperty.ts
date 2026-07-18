import type { Property } from '../property/types/Property.js';
import { SkipAfterProperty } from '../property/plugins/SkipAfterProperty.js';
import { TimeoutProperty } from '../property/plugins/TimeoutProperty.js';
import { UnbiasedProperty } from '../property/plugins/UnbiasedProperty.js';
import type { QualifiedParameters } from './configuration/QualifiedParameters.js';
import { IgnoreEqualValuesProperty } from '../property/plugins/IgnoreEqualValuesProperty.js';

// This helper MUST capture the following globals to avoid test runners to mock our internals and defeat us
const safeDateNow = Date.now;
const safeSetTimeout = setTimeout;
const safeClearTimeout = clearTimeout;

/** @internal */
type MinimalQualifiedParameters<Ts> = Pick<
  QualifiedParameters<Ts>,
  'unbiased' | 'timeout' | 'skipAllAfterTimeLimit' | 'interruptAfterTimeLimit' | 'skipEqualValues' | 'ignoreEqualValues'
>;

/** @internal */
export function decorateProperty<Ts>(rawProperty: Property<Ts>, qParams: MinimalQualifiedParameters<Ts>): Property<Ts> {
  let prop = rawProperty;
  if (qParams.timeout !== undefined) {
    prop = new TimeoutProperty(prop, qParams.timeout, safeSetTimeout, safeClearTimeout);
  }
  if (qParams.unbiased) {
    prop = new UnbiasedProperty(prop);
  }
  if (qParams.skipAllAfterTimeLimit !== undefined) {
    prop = new SkipAfterProperty(
      prop,
      safeDateNow,
      qParams.skipAllAfterTimeLimit,
      false,
      safeSetTimeout,
      safeClearTimeout,
    );
  }
  if (qParams.interruptAfterTimeLimit !== undefined) {
    prop = new SkipAfterProperty(
      prop,
      safeDateNow,
      qParams.interruptAfterTimeLimit,
      true,
      safeSetTimeout,
      safeClearTimeout,
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

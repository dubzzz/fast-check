import { webUrl } from '../../../src/arbitrary/webUrl';

import { URL } from 'url';
import * as genericHelper from '../check/arbitrary/generic/GenericArbitraryHelper';
import fc from '../../../lib/fast-check';

const isValidUrl = (t: string) => {
  // Valid url given the specs defined by WHATWG URL Standard
  // https://url.spec.whatwg.org/
  try {
    // A TypeError will be thrown if the input is not a valid URL.
    // https://nodejs.org/api/url.html#url_constructor_new_url_input_base
    new URL(t);
    return true;
  } catch (err) {
    return false;
  }
};

describe('WebArbitrary', () => {
  describe('webUrl', () => {
    genericHelper.isValidArbitrary(webUrl, {
      isValidValue: (g: string) => isValidUrl(g),
      seedGenerator: fc.record(
        {
          validSchemes: fc.constant(['ftp']),
          authoritySettings: fc.record(
            {
              withIPv4: fc.boolean(),
              withIPv6: fc.boolean(),
              withIPv4Extended: fc.boolean(),
              withUserInfo: fc.boolean(),
              withPort: fc.boolean(),
            },
            { withDeletedKeys: true }
          ),
          withQueryParameters: fc.boolean(),
          withFragments: fc.boolean(),
        },
        { withDeletedKeys: true }
      ),
    });
  });
});

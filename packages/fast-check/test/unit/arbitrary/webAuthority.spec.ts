import fc from 'fast-check';
import { webAuthority, WebAuthorityConstraints } from '../../../src/arbitrary/webAuthority';
import { URL } from 'url';

import { assertValidArbitrary } from './__test-helpers__/ArbitraryAssertions';
import { relativeSizeArb, sizeArb } from './__test-helpers__/SizeHelpers';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('webAuthority (integration)', () => {
  type Extra = WebAuthorityConstraints;
  const extraParameters = fc.record(
    {
      withIPv4: fc.boolean(),
      withIPv4Extended: fc.boolean(),
      withIPv6: fc.boolean(),
      withPort: fc.boolean(),
      withUserInfo: fc.boolean(),
      size: fc.oneof(sizeArb, relativeSizeArb),
    },
    { requiredKeys: [] },
  );

  const isCorrect = (webAuthority: string) => {
    expect(() => new URL(`http://${webAuthority}`)).not.toThrow();
  };

  const webAuthorityBuilder = (extra: Extra) => webAuthority(extra);

  it('should be a valid arbitrary', () => {
    assertValidArbitrary(
      webAuthorityBuilder,
      {
        sameValueGivenSameSeed: {},
        correctValues: { isCorrect },
        shrinkableWithoutContext: {},
        sameValueWithoutInitialContext: {},
      },
      { extraParameters },
    );
  });
});

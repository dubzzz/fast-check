import fc from '../../../lib/fast-check';
import { webAuthority, WebAuthorityConstraints } from '../../../src/arbitrary/webAuthority';
import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { URL } from 'url';

import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/NextArbitraryAssertions';
import { relativeSizeArb, sizeArb } from './__test-helpers__/SizeHelpers';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('webAuthority (integration)', () => {
  type Extra = WebAuthorityConstraints;
  const extraParametersBuilder: (onlySmall?: boolean) => fc.Arbitrary<Extra> = (onlySmall?: boolean) =>
    fc.record(
      {
        withIPv4: fc.boolean(),
        withIPv4Extended: fc.boolean(),
        withIPv6: fc.boolean(),
        withPort: fc.boolean(),
        withUserInfo: fc.boolean(),
        size: onlySmall ? fc.constantFrom('-1', '=', 'xsmall', 'small') : fc.oneof(sizeArb, relativeSizeArb),
      },
      { requiredKeys: [] }
    );

  const isCorrectForURL = (webAuthority: string) => {
    expect(() => new URL(`http://${webAuthority}`)).not.toThrow();
  };

  const webAuthorityBuilder = (extra: Extra) => convertToNext(webAuthority(extra));

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(webAuthorityBuilder, { extraParameters: extraParametersBuilder() });
  });

  it('should only produce correct values regarding `new URL`', () => {
    assertProduceCorrectValues(webAuthorityBuilder, isCorrectForURL, { extraParameters: extraParametersBuilder() });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(webAuthorityBuilder, { extraParameters: extraParametersBuilder(true) });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(webAuthorityBuilder, {
      extraParameters: extraParametersBuilder(true),
    });
  });
});

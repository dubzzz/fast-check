import { describe, it, expect, vi } from 'vitest';
import fc from 'fast-check';
import type { WebUrlConstraints } from '../../../src/arbitrary/webUrl';
import { webUrl } from '../../../src/arbitrary/webUrl';
import { URL } from 'url';

import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/ArbitraryAssertions';
import { Value } from '../../../src/check/arbitrary/definition/Value';
import { buildShrinkTree, renderTree } from './__test-helpers__/ShrinkTree';
import { relativeSizeArb, sizeArb, sizeRelatedGlobalConfigArb } from './__test-helpers__/SizeHelpers';

import * as WebAuthorityMock from '../../../src/arbitrary/webAuthority';
import * as WebFragmentsMock from '../../../src/arbitrary/webFragments';
import * as WebQueryParametersMock from '../../../src/arbitrary/webQueryParameters';
import * as WebPathMock from '../../../src/arbitrary/webPath';
import { withConfiguredGlobal } from './__test-helpers__/GlobalSettingsHelpers';
import { fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';
import { declareCleaningHooksForSpies } from './__test-helpers__/SpyCleaner';

describe('webUrl', () => {
  declareCleaningHooksForSpies();

  it('should always use the same size value for all its sub-arbitraries (except webAuthority when using its own)', () => {
    fc.assert(
      fc.property(sizeRelatedGlobalConfigArb, webUrlConstraintsBuilder(), (config, constraints) => {
        // Arrange
        const { instance } = fakeArbitrary();
        const webAuthority = vi.spyOn(WebAuthorityMock, 'webAuthority');
        webAuthority.mockReturnValue(instance);
        const webFragments = vi.spyOn(WebFragmentsMock, 'webFragments');
        webFragments.mockReturnValue(instance);
        const webQueryParameters = vi.spyOn(WebQueryParametersMock, 'webQueryParameters');
        webQueryParameters.mockReturnValue(instance);
        const webPath = vi.spyOn(WebPathMock, 'webPath');
        webPath.mockReturnValue(instance);

        // Act
        withConfiguredGlobal(config, () => webUrl(constraints));

        // Assert
        expect(webPath).toHaveBeenCalledTimes(1); // always used
        expect(webAuthority).toHaveBeenCalledTimes(1); // always used
        const resolvedSizeForPath = webPath.mock.calls[0][0]!.size;
        if (constraints.authoritySettings === undefined || constraints.authoritySettings === undefined) {
          expect(webAuthority.mock.calls[0][0]!.size).toBe(resolvedSizeForPath);
        }
        if (constraints.withFragments) {
          expect(webFragments.mock.calls[0][0]!.size).toBe(resolvedSizeForPath);
        }
        if (constraints.withQueryParameters) {
          expect(webQueryParameters.mock.calls[0][0]!.size).toBe(resolvedSizeForPath);
        }
      }),
    );
  });
});

describe('webUrl (integration)', () => {
  type Extra = WebUrlConstraints;

  const extraParametersBuilder = webUrlConstraintsBuilder;

  const isCorrect = (t: string) => {
    // Valid url given the specs defined by WHATWG URL Standard: https://url.spec.whatwg.org/
    // A TypeError will be thrown if the input is not a valid URL: https://nodejs.org/api/url.html#url_constructor_new_url_input_base
    expect(() => new URL(t)).not.toThrow();
  };

  const webUrlBuilder = (extra: Extra) => webUrl(extra);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(webUrlBuilder, { extraParameters: extraParametersBuilder() });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(webUrlBuilder, isCorrect, { extraParameters: extraParametersBuilder() });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(webUrlBuilder, { extraParameters: extraParametersBuilder(true) });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(webUrlBuilder, {
      extraParameters: extraParametersBuilder(true),
    });
  });

  it.each`
    rawValue
    ${'http://my.domain.org/a/z'}
    ${'http://user:pass@my.domain.org/a/z'}
    ${'http://my.domain.org/a/z?query#fragments'}
  `('should be able to shrink $rawValue', ({ rawValue }) => {
    // Arrange
    const arb = webUrl({
      authoritySettings: { withUserInfo: true },
      withQueryParameters: true,
      withFragments: true,
    });
    const value = new Value(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});

// Helpers

function webUrlConstraintsBuilder(onlySmall?: boolean): fc.Arbitrary<WebUrlConstraints> {
  return fc.record(
    {
      validSchemes: fc.constant<string[]>(['ftp']),
      authoritySettings: fc.record(
        {
          withIPv4: fc.boolean(),
          withIPv6: fc.boolean(),
          withIPv4Extended: fc.boolean(),
          withUserInfo: fc.boolean(),
          withPort: fc.boolean(),
          size: onlySmall
            ? fc.constantFrom(...(['-1', '=', 'xsmall', 'small'] as const))
            : fc.oneof(sizeArb, relativeSizeArb),
        },
        { requiredKeys: [] },
      ),
      withQueryParameters: fc.boolean(),
      withFragments: fc.boolean(),
      size: onlySmall
        ? fc.constantFrom(...(['-1', '=', 'xsmall', 'small'] as const))
        : fc.oneof(sizeArb, relativeSizeArb),
    },
    { requiredKeys: [] },
  );
}

import fc from '../../../lib/fast-check';
import { webUrl, WebUrlConstraints } from '../../../src/arbitrary/webUrl';
import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { URL } from 'url';

import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from '../check/arbitrary/generic/NextArbitraryAssertions';
import { NextValue } from '../../../src/check/arbitrary/definition/NextValue';
import { buildNextShrinkTree, renderTree } from '../check/arbitrary/generic/ShrinkTree';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('webUrl (integration)', () => {
  type Extra = WebUrlConstraints;
  const extraParameters: fc.Arbitrary<Extra> = fc.record(
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
        { requiredKeys: [] }
      ),
      withQueryParameters: fc.boolean(),
      withFragments: fc.boolean(),
    },
    { requiredKeys: [] }
  );

  const isCorrect = (t: string) => {
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

  const webUrlBuilder = (extra: Extra) => convertToNext(webUrl(extra));

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(webUrlBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(webUrlBuilder, isCorrect);
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(webUrlBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(webUrlBuilder, { extraParameters });
  });

  it.each`
    rawValue
    ${'http://my.domain.org/a/z'}
    ${'http://my.domain.org/a/z?query#fragments'}
  `('should be able to shrink $rawValue', ({ rawValue }) => {
    // Arrange
    const arb = convertToNext(webUrl({ withQueryParameters: true, withFragments: true }));
    const value = new NextValue(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildNextShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});

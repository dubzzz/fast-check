import fc from 'fast-check';
import { webPath, WebPathConstraints } from '../../../src/arbitrary/webPath';
import { URL } from 'url';

import {
  assertProduceCorrectValues,
  assertProduceSameValueGivenSameSeed,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/ArbitraryAssertions';
import { Value } from '../../../src/check/arbitrary/definition/Value';
import { buildShrinkTree, renderTree } from './__test-helpers__/ShrinkTree';
import { relativeSizeArb, sizeArb } from './__test-helpers__/SizeHelpers';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('webPath (integration)', () => {
  type Extra = WebPathConstraints;

  const extraParametersBuilder = webPathConstraintsBuilder;

  const isCorrect = (path: string) => {
    // Valid path given the specs defined by WHATWG URL Standard: https://url.spec.whatwg.org/
    // A TypeError will be thrown if the input is not a valid URL: https://nodejs.org/api/url.html#url_constructor_new_url_input_base
    expect(() => new URL(path, 'http://domain')).not.toThrow();
    expect(path[0]).toBe('/');
  };

  const webPathBuilder = (extra: Extra) => webPath(extra);

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(webPathBuilder, { extraParameters: extraParametersBuilder() });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(webPathBuilder, isCorrect, { extraParameters: extraParametersBuilder() });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(webPathBuilder, { extraParameters: extraParametersBuilder(true) });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(webPathBuilder, {
      extraParameters: extraParametersBuilder(true),
    });
  });

  it.each`
    rawValue
    ${'/a/z'}
    ${'/azerty'}
  `('should be able to shrink $rawValue', ({ rawValue }) => {
    // Arrange
    const arb = webPath();
    const value = new Value(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});

// Helpers

function webPathConstraintsBuilder(onlySmall?: boolean): fc.Arbitrary<WebPathConstraints> {
  return fc.record(
    { size: onlySmall ? fc.constantFrom('-1', '=', 'xsmall', 'small') : fc.oneof(sizeArb, relativeSizeArb) },
    { requiredKeys: [] }
  );
}

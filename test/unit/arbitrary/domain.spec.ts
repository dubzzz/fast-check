import fc from '../../../lib/fast-check';
import { domain } from '../../../src/arbitrary/domain';
import { Value } from '../../../src/check/arbitrary/definition/Value';

import {
  assertProduceSameValueGivenSameSeed,
  assertProduceCorrectValues,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/ArbitraryAssertions';
import { buildShrinkTree, renderTree } from './__test-helpers__/ShrinkTree';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('domain (integration)', () => {
  const isValidDomain = (t: string) => {
    // According to https://www.ietf.org/rfc/rfc1034.txt
    // <domain> ::= <subdomain> | " "
    // <subdomain> ::= <label> | <subdomain> "." <label>
    // <label> ::= <letter> [ [ <ldh-str> ] <let-dig> ]
    // <ldh-str> ::= <let-dig-hyp> | <let-dig-hyp> <ldh-str>
    // <let-dig-hyp> ::= <let-dig> | "-"
    // <let-dig> ::= <letter> | <digit>
    // Relaxed by https://www.ietf.org/rfc/rfc1123.txt
    // allowing first character of subdomain to be a digit
    const rfc1123SubDomain = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
    return t.split('.').every((sd) => rfc1123SubDomain.test(sd) && sd.length <= 63) && t.length <= 255;
  };

  const isValidDomainWithExtension = (t: string) => {
    const subdomains = t.split('.');
    return isValidDomain(t) && subdomains.length >= 2 && /^[a-z]{2,}$/.test(subdomains[subdomains.length - 1]);
  };

  const isCorrect = isValidDomainWithExtension;

  const domainBuilder = () => domain();

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(domainBuilder);
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(domainBuilder, isCorrect);
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(domainBuilder);
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(domainBuilder);
  });

  it.each`
    rawValue
    ${'domain.com'}
  `('should be able to shrink $rawValue', ({ rawValue }) => {
    // Arrange
    const arb = domain();
    const value = new Value(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});

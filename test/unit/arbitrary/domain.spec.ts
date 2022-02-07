import fc from '../../../lib/fast-check';
import { domain, DomainConstraints } from '../../../src/arbitrary/domain';
import { convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import { NextValue } from '../../../src/check/arbitrary/definition/NextValue';
import { URL } from 'url';

import {
  assertProduceSameValueGivenSameSeed,
  assertProduceCorrectValues,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/NextArbitraryAssertions';
import { buildNextShrinkTree, renderTree } from './__test-helpers__/ShrinkTree';
import { sizeArb } from './__test-helpers__/SizeHelpers';

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
    return isValidDomain(t) && subdomains.length >= 2;
  };

  type Extra = DomainConstraints;
  const extraParameters: fc.Arbitrary<Extra> = fc.record({ size: sizeArb }, { requiredKeys: [] });

  const isCorrect = isValidDomainWithExtension;

  const isCorrectForURL = (domain: string) => {
    expect(() => new URL(`http://${domain}`)).not.toThrow();
  };

  const domainBuilder = (extra: Extra) => convertToNext(domain(extra));

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(domainBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(domainBuilder, isCorrect, { extraParameters });
  });

  it('should only produce correct values regarding `new URL`', () => {
    assertProduceCorrectValues(domainBuilder, isCorrectForURL, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context', () => {
    assertProduceValuesShrinkableWithoutContext(domainBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(domainBuilder, { extraParameters });
  });

  it.each`
    source
    ${'very-very-very-very-very-very-very-very-very-very-very-long-domain.com' /* label too long >63 */}
    ${`${'a.'.repeat(128)}com` /* domain too long >255 */}
  `('should not be able to generate $source with fc.domain()', ({ source }) => {
    // Arrange / Act
    const arb = convertToNext(domain());
    const out = arb.canShrinkWithoutContext(source);

    // Assert
    expect(out).toBe(false);
  });

  it.each`
    rawValue
    ${'domain.com'}
    ${'a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z.fr'}
    ${'very-very-very-very-very-very-very-very-very-long-domain.very-long-extension' /* longer than default maxGeneratedLength but ok for shrink */}
  `('should be able to shrink $rawValue', ({ rawValue }) => {
    // Arrange
    const arb = convertToNext(domain());
    const value = new NextValue(rawValue, undefined);

    // Act
    const renderedTree = renderTree(buildNextShrinkTree(arb, value, { numItems: 100 })).join('\n');

    // Assert
    expect(arb.canShrinkWithoutContext(rawValue)).toBe(true);
    expect(renderedTree).toMatchSnapshot();
  });
});

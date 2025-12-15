import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import type { DomainConstraints } from '../../../src/arbitrary/domain.js';
import { domain } from '../../../src/arbitrary/domain.js';
import { Value } from '../../../src/check/arbitrary/definition/Value.js';
import { URL } from 'url';

import {
  assertProduceSameValueGivenSameSeed,
  assertProduceCorrectValues,
  assertProduceValuesShrinkableWithoutContext,
  assertShrinkProducesSameValueWithoutInitialContext,
} from './__test-helpers__/ArbitraryAssertions.js';
import { buildShrinkTree, renderTree } from './__test-helpers__/ShrinkTree.js';
import { relativeSizeArb, sizeArb } from './__test-helpers__/SizeHelpers.js';
import { declareCleaningHooksForSpies } from './__test-helpers__/SpyCleaner.js';

describe('domain (integration)', () => {
  declareCleaningHooksForSpies();

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

  type Extra = DomainConstraints;
  const extraParameters: fc.Arbitrary<Extra> = fc.record(
    { size: fc.oneof(sizeArb, relativeSizeArb) },
    { requiredKeys: [] },
  );

  const isCorrect = isValidDomainWithExtension;

  const isCorrectForURL = (domain: string) => {
    expect(() => new URL(`http://${domain}`)).not.toThrow();
  };

  const domainBuilder = (extra: Extra) => domain(extra);

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
    ${'very-very-very-very-very-very-very-very-very-very-very-long-label.com' /* label too long >63 */}
    ${`${'a.'.repeat(128)}com`}
  `(/* domain too long >255 */ 'should not be able to generate $source with fc.domain()', ({ source }) => {
    // Arrange / Act
    const arb = domain();
    const out = arb.canShrinkWithoutContext(source);

    // Assert
    expect(out).toBe(false);
  });

  it.each`
    rawValue
    ${'domain.com'}
    ${'a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p.q.r.s.t.u.v.w.x.y.z.fr'}
    ${'very-very-very-very-very-very-very-very-very-long-label.com' /* label longer than default maxGeneratedLength but ok for shrink */}
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

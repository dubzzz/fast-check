import { domain, filterInvalidSubdomainLabel } from '../../../../src/check/arbitrary/HostArbitrary';

import * as genericHelper from './generic/GenericArbitraryHelper';
import fc from '../../../../lib/fast-check';

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

describe('DomainArbitrary', () => {
  describe('domain', () => {
    genericHelper.isValidArbitrary(() => domain(), {
      isValidValue: (g: string) => isValidDomainWithExtension(g),
    });
  });

  describe('filterInvalidSubdomainLabel', () => {
    // Internal function:
    // We are not checking all the requirements of subdomains but just the ones we need to ensure
    // post construction as they cannot be easily enforced except by a filtering logic
    const alphaChar = () => fc.mapToConstant({ num: 26, build: (v) => String.fromCharCode(v + 0x61) });
    it('Should accept any subdomain composed of only alphabet characters and with at most 63 characters', () =>
      fc.assert(
        fc.property(fc.stringOf(alphaChar(), { minLength: 1, maxLength: 63 }), (subdomainLabel) => {
          expect(filterInvalidSubdomainLabel(subdomainLabel)).toBe(true);
        })
      ));
    it('Should reject any subdomain with strictly more than 63 characters', () =>
      fc.assert(
        fc.property(fc.stringOf(alphaChar(), { minLength: 64 }), (subdomainLabel) => {
          expect(filterInvalidSubdomainLabel(subdomainLabel)).toBe(false);
        })
      ));
    it('Should reject any subdomain starting by "xn--"', () =>
      fc.assert(
        fc.property(fc.stringOf(alphaChar(), { maxLength: 63 - 'xn--'.length }), (subdomainLabelEnd) => {
          const subdomainLabel = `xn--${subdomainLabelEnd}`;
          expect(filterInvalidSubdomainLabel(subdomainLabel)).toBe(false);
        })
      ));
    it('Should not reject subdomains if they start by a substring of "xn--"', () =>
      fc.assert(
        fc.property(
          fc.stringOf(alphaChar(), { maxLength: 63 - 'xn--'.length }),
          fc.nat('xn--'.length - 1),
          (subdomainLabelEnd, keep) => {
            const subdomainLabel = `${'xn--'.substring(0, keep)}${subdomainLabelEnd}`;
            expect(filterInvalidSubdomainLabel(subdomainLabel)).toBe(true);
          }
        )
      ));
  });
});

import { domain } from '../../../../src/check/arbitrary/HostArbitrary';

import * as genericHelper from './generic/GenericArbitraryHelper';

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
  return t.split('.').every(sd => rfc1123SubDomain.test(sd) && sd.length <= 63) && t.length <= 255;
};

const isValidDomainWithExtension = (t: string) => {
  const subdomains = t.split('.');
  return isValidDomain(t) && subdomains.length >= 2 && /^[a-z]{2,}$/.test(subdomains[subdomains.length - 1]);
};

describe('DomainArbitrary', () => {
  describe('domain', () => {
    genericHelper.isValidArbitrary(() => domain(), {
      isValidValue: (g: string) => isValidDomainWithExtension(g)
    });
  });
});

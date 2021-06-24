import { emailAddress } from '../../../src/arbitrary/emailAddress';

import * as genericHelper from '../check/arbitrary/generic/GenericArbitraryHelper';

const isValidEmailRfc1123 = (t: string) => {
  // Taken from https://www.w3.org/TR/html5/forms.html#valid-e-mail-address
  const rfc1123 =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return rfc1123.test(t);
};

const isValidEmailRfc2821 = (t: string) => {
  const [localPart, domain] = t.split('@');
  // The maximum total length of a user name or other local-part is 64 characters.
  // The maximum total length of a domain name or number is 255 characters.
  return localPart.length <= 64 && domain.length <= 255;
};

const isValidEmailRfc5322 = (t: string) => {
  // Taken from https://stackoverflow.com/questions/201323/how-to-validate-an-email-address-using-a-regular-expression
  const rfc5322 =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return rfc5322.test(t);
};

describe('EmailArbitrary', () => {
  describe('emailAddress', () => {
    describe('RFC 1123', () => {
      genericHelper.isValidArbitrary(() => emailAddress(), {
        isValidValue: (g: string) => isValidEmailRfc1123(g),
      });
    });
    describe('RFC 2821', () => {
      genericHelper.isValidArbitrary(() => emailAddress(), {
        isValidValue: (g: string) => isValidEmailRfc2821(g),
      });
    });
    describe('RFC 5322', () => {
      genericHelper.isValidArbitrary(() => emailAddress(), {
        isValidValue: (g: string) => isValidEmailRfc5322(g),
      });
    });
  });
});

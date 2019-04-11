import { emailAddress } from '../../../../src/check/arbitrary/EmailArbitrary';

import * as genericHelper from './generic/GenericArbitraryHelper';

const isValidEmailRfc1123 = (t: string) => {
  // Taken from https://www.w3.org/TR/html5/forms.html#valid-e-mail-address
  const rfc1123 = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return rfc1123.test(t);
};

const isValidEmailRfc5322 = (t: string) => {
  // Taken from https://stackoverflow.com/questions/201323/how-to-validate-an-email-address-using-a-regular-expression
  const rfc5322 = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return rfc5322.test(t);
};

describe('EmailArbitrary', () => {
  describe('emailAddress', () => {
    describe('RFC 1123', () => {
      genericHelper.isValidArbitrary(() => emailAddress(), {
        isValidValue: (g: string) => isValidEmailRfc1123(g)
      });
    });
    describe('RFC 5322', () => {
      genericHelper.isValidArbitrary(() => emailAddress(), {
        isValidValue: (g: string) => isValidEmailRfc5322(g)
      });
    });
  });
});

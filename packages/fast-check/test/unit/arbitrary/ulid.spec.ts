import fc from 'fast-check';
import { ulid } from '../../../src/arbitrary/ulid';

import { assertProduceSameValueGivenSameSeed } from './__test-helpers__/ArbitraryAssertions';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('ulid (integration)', () => {
  it('ulid', () => {
    assertProduceSameValueGivenSameSeed(ulid);
  });
});

import { cloneMethod } from '../../../src/check/symbols';
import * as fc from '../../../lib/fast-check';

describe('symbols', () => {
  it('should declare distinct cloneMethod for distinct libraries', () => {
    expect(cloneMethod).not.toBe(fc.cloneMethod);
  });
});

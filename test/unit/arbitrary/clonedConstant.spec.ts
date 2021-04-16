import { constant } from '../../../src/arbitrary/constant';
import { clonedConstant } from '../../../src/arbitrary/clonedConstant';

describe('clonedConstant', () => {
  it('should be the same function as constant', () => {
    expect(clonedConstant).toBe(constant);
  });
});

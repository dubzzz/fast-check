import { pre } from '../../../../src/check/precondition/Pre';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure';

describe('pre', () => {
  it('should not throw on thruthy condition', () => {
    expect(() => pre(true)).not.toThrow();
  });
  it('should throw a PreconditionFailure on falsy condition', () => {
    let failed = false;
    try {
      pre(false);
    } catch (err) {
      failed = true;
      expect(PreconditionFailure.isFailure(err)).toBe(true);
    }
    expect(failed).toBe(true);
  });
});

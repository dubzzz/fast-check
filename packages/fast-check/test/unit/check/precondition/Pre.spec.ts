import { pre } from '../../../../src/check/precondition/Pre';
import { PreconditionFailure } from '../../../../src/check/precondition/PreconditionFailure';
import * as fc from '../../../../lib/fast-check';

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
  it('should not understand PreconditionFailure thrown by other instances', () => {
    let failed = false;
    try {
      fc.pre(false);
    } catch (err) {
      failed = true;
      expect(PreconditionFailure.isFailure(err)).toBe(false);
    }
    expect(failed).toBe(true);
  });
});

import * as fc from '../../../../../lib/fast-check';

import { sanitizeArgs } from '../../../../../src/check/arbitrary/helpers/ArgsSanitizer';

describe('ArgsSanitizer', () => {
  describe('sanitizeArgs', () => {
    it('Should return the original args if no trailing undefined', () =>
      fc.assert(
        fc.property(
          fc.array(fc.anything()).filter((args) => args.length === 0 || args[args.length - 1] !== undefined),
          (args) => {
            expect(sanitizeArgs(args)).toBe(args);
          }
        )
      ));
    it('Should remove trailing undefined from the args', () =>
      fc.assert(
        fc.property(
          fc.array(fc.anything()).filter((args) => args.length === 0 || args[args.length - 1] !== undefined),
          fc.array(fc.constant(undefined)),
          (args, trailingUndefinedArgs) => {
            expect(sanitizeArgs([...args, ...trailingUndefinedArgs])).toEqual(args);
          }
        )
      ));
  });
});

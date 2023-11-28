import fc from '../../src/fast-check';
import { runWithSanitizedStack } from './__test-helpers__/StackSanitizer';

const settings = { seed: 42, verbose: 0 };

describe.each([{ includeErrorInReport: false }, { includeErrorInReport: true }])(
  `NoRegressionStack (includeErrorInReport: $includeErrorInReport)`,
  ({ includeErrorInReport }) => {
    it('return false', () => {
      expect(
        runWithSanitizedStack(() =>
          fc.assert(
            fc.property(fc.nat(), fc.nat(), (a, b) => {
              return a >= b;
            }),
            { ...settings, includeErrorInReport },
          ),
        ),
      ).toThrowErrorMatchingSnapshot();
    });
    it('throw', () => {
      expect(
        runWithSanitizedStack(() =>
          fc.assert(
            fc.property(fc.nat(), fc.nat(), (a, b) => {
              if (a < b) {
                throw new Error('a must be >= b');
              }
            }),
            { ...settings, includeErrorInReport },
          ),
        ),
      ).toThrowErrorMatchingSnapshot();
    });
    it('not a function', () => {
      expect(
        runWithSanitizedStack(() =>
          fc.assert(
            fc.property(fc.nat(), (v) => {
              (v as any)();
            }),
            { ...settings, includeErrorInReport },
          ),
        ),
      ).toThrowErrorMatchingSnapshot();
    });
  },
);

import * as fc from '../../../../../lib/fast-check';
import * as prand from 'pure-rand';

import { QualifiedParameters } from '../../../../../src/check/runner/configuration/QualifiedParameters';
import { RandomType } from '../../../../../src/check/runner/configuration/RandomType';
import { VerbosityLevel } from '../../../../../src/check/runner/configuration/VerbosityLevel';

const parametersArbitrary = fc.record(
  {
    seed: fc.integer(),
    randomType: fc.constantFrom(
      prand.mersenne,
      prand.congruential,
      prand.congruential32,
      prand.xorshift128plus,
      prand.xoroshiro128plus
    ),
    numRuns: fc.nat(),
    maxSkipsPerRun: fc.nat(),
    timeout: fc.nat(),
    skipAllAfterTimeLimit: fc.nat(),
    interruptAfterTimeLimit: fc.nat(),
    markInterruptAsFailure: fc.boolean(),
    skipEqualValues: fc.boolean(),
    ignoreEqualValues: fc.boolean(),
    path: fc.array(fc.nat()).map((arr) => arr.join(':')),
    logger: fc.func(fc.constant(undefined)),
    unbiased: fc.boolean(),
    verbose: fc.constantFrom(VerbosityLevel.None, VerbosityLevel.Verbose, VerbosityLevel.VeryVerbose),
    examples: fc.array(fc.nat()),
    endOnFailure: fc.boolean(),
    reporter: fc.func(fc.constant(undefined)),
    asyncReporter: fc.func(fc.constant(Promise.resolve(undefined))),
  },
  { withDeletedKeys: true }
);

const hardCodedRandomType = fc.constantFrom(
  'mersenne',
  'congruential',
  'congruential32',
  'xorshift128plus',
  'xoroshiro128plus'
) as fc.Arbitrary<RandomType>;

describe('QualifiedParameters', () => {
  describe('read', () => {
    it('Should forward as-is values already set in Parameters', () =>
      fc.assert(
        fc.property(parametersArbitrary, (params) => {
          const qualifiedParams = QualifiedParameters.read(params);
          for (const key of Object.keys(params)) {
            expect(qualifiedParams).toHaveProperty(key);
            expect((qualifiedParams as any)[key]).toEqual((params as any)[key]);
          }
        })
      ));
    it('Should transform verbose boolean to its corresponding VerbosityLevel', () =>
      fc.assert(
        fc.property(parametersArbitrary, fc.boolean(), (params, verbose) => {
          const expectedVerbosityLevel = verbose ? VerbosityLevel.Verbose : VerbosityLevel.None;
          const qparams = QualifiedParameters.read({ ...params, verbose });
          return qparams.verbose === expectedVerbosityLevel;
        })
      ));
    it('Should transform correctly hardcoded randomType', () =>
      fc.assert(
        fc.property(parametersArbitrary, hardCodedRandomType, (params, randomType) => {
          const qparams = QualifiedParameters.read({ ...params, randomType });
          return qparams.randomType === prand[randomType];
        })
      ));
    it('Should throw on invalid randomType', () =>
      fc.assert(
        fc.property(parametersArbitrary, (params) => {
          expect(() => QualifiedParameters.read({ ...params, randomType: 'invalid' as RandomType })).toThrowError();
        })
      ));
    describe('Seeds outside of 32 bits range', () => {
      const seedsOutsideRangeArb = fc.oneof(
        fc.double(),
        fc.double({ min: Number.MIN_VALUE, max: Number.MAX_VALUE }),
        fc.integer(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER),
        fc.constantFrom(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NaN)
      );
      it('Should produce 32 bits signed seed', () =>
        fc.assert(
          fc.property(seedsOutsideRangeArb, (unsafeSeed) => {
            const qparams = QualifiedParameters.read({ seed: unsafeSeed });
            return (qparams.seed | 0) === qparams.seed;
          })
        ));
      it('Should produce the same seed given the same input', () =>
        fc.assert(
          fc.property(seedsOutsideRangeArb, (unsafeSeed) => {
            const qparams1 = QualifiedParameters.read({ seed: unsafeSeed });
            const qparams2 = QualifiedParameters.read({ seed: unsafeSeed });
            return qparams1.seed === qparams2.seed;
          })
        ));
      it('Should transform distinct values between 0 and 1 into distinct seeds', () =>
        fc.assert(
          fc.property(fc.double(), fc.double(), (unsafeSeed1, unsafeSeed2) => {
            fc.pre(Math.abs(unsafeSeed1 * 0xffffffff - unsafeSeed2 * 0xffffffff) >= 1);
            const qparams1 = QualifiedParameters.read({ seed: unsafeSeed1 });
            const qparams2 = QualifiedParameters.read({ seed: unsafeSeed2 });
            return qparams1.seed !== qparams2.seed;
          })
        ));
      it('Should truncate integer values into a 32 signed bits seed', () =>
        fc.assert(
          fc.property(fc.integer(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER), (unsafeSeed) => {
            const qparams = QualifiedParameters.read({ seed: unsafeSeed });
            return qparams.seed === (unsafeSeed | 0);
          })
        ));
    });
  });
});

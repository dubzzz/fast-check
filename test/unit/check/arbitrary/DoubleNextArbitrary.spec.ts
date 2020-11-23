import * as fc from '../../../../lib/fast-check';

import { decomposeDouble, doubleToIndex, indexToDouble } from '../../../../src/check/arbitrary/DoubleNextArbitrary';

const float64raw = () => {
  return fc
    .tuple(fc.integer(), fc.integer())
    .map(([na32, nb32]) => new Float64Array(new Int32Array([na32, nb32]).buffer)[0]);
};
/*const floatNextConstraints = () => {
  return fc
    .record(
      { min: float32raw(), max: float32raw(), noDefaultInfinity: fc.boolean(), noNaN: fc.boolean() },
      { withDeletedKeys: true }
    )
    .filter((ct) => (ct.min === undefined || !Number.isNaN(ct.min)) && (ct.max === undefined || !Number.isNaN(ct.max)))
    .filter((ct) => {
      if (!ct.noDefaultInfinity) return true;
      if (ct.min === Number.POSITIVE_INFINITY && ct.max === undefined) return false;
      if (ct.min === undefined && ct.max === Number.NEGATIVE_INFINITY) return false;
      return true;
    })
    .map((ct) => {
      if (ct.min === undefined || ct.max === undefined) return ct;
      const { min, max } = ct;
      if (min < max) return ct;
      if (min === max && (min !== 0 || 1 / min <= 1 / max)) return ct;
      return { ...ct, min: max, max: min };
    });
};*/

type Index = ReturnType<typeof doubleToIndex>;

const isStrictlySmaller = (da: number, db: number) => {
  if (da === 0 && db === 0) return 1 / da < 1 / db;
  return da < db;
};
const toIndex = (raw: bigint | string): Index => {
  const b = typeof raw === 'string' ? BigInt(raw) : raw;
  const pb = b < BigInt(0) ? -b : b;
  return { sign: b < BigInt(0) ? -1 : 1, data: [Number(pb >> BigInt(32)), Number(pb & BigInt(0xffffffff))] };
};
const toBigInt = (index: Index): bigint => {
  return BigInt(index.sign) * ((BigInt(index.data[0]) << BigInt(32)) + BigInt(index.data[1]));
};

describe('DoubleNextArbitrary', () => {
  /*describe('floatNext', () => {
    it('Should accept any valid range of 32-bit floating point numbers (including infinity)', () =>
      fc.assert(
        fc.property(floatNextConstraints(), (ct) => {
          expect(floatNext(ct)).toBeDefined();
        })
      ));
    it('Should accept any constraits defining min (32-bit float not-NaN) equal to max', () =>
      fc.assert(
        fc.property(
          float32raw(),
          fc.record({ noDefaultInfinity: fc.boolean(), noNaN: fc.boolean() }, { withDeletedKeys: true }),
          (f, otherCt) => {
            fc.pre(isNotNaN32bits(f));
            expect(floatNext({ ...otherCt, min: f, max: f })).toBeDefined();
          }
        )
      ));
    it('Should reject non-32-bit or NaN floating point numbers if specified for min', () =>
      fc.assert(
        fc.property(float64raw(), (f64) => {
          fc.pre(!isNotNaN32bits(f64));
          expect(() => floatNext({ min: f64 })).toThrowError();
        })
      ));
    it('Should reject non-32-bit or NaN floating point numbers if specified for max', () =>
      fc.assert(
        fc.property(float64raw(), (f64) => {
          fc.pre(!isNotNaN32bits(f64));
          expect(() => floatNext({ max: f64 })).toThrowError();
        })
      ));
    it('Should reject if specified min is strictly greater than max', () =>
      fc.assert(
        fc.property(float32raw(), float32raw(), (fa32, fb32) => {
          fc.pre(isNotNaN32bits(fa32));
          fc.pre(isNotNaN32bits(fb32));
          fc.pre(!Object.is(fa32, fb32)); // Object.is can distinguish -0 from 0, while !== cannot
          const min = isStrictlySmaller(fa32, fb32) ? fb32 : fa32;
          const max = isStrictlySmaller(fa32, fb32) ? fa32 : fb32;
          expect(() => floatNext({ min, max })).toThrowError();
        })
      ));
    it('Should reject impossible noDefaultInfinity-based ranges', () => {
      expect(() => floatNext({ min: Number.POSITIVE_INFINITY, noDefaultInfinity: true })).toThrowError();
      expect(() => floatNext({ max: Number.NEGATIVE_INFINITY, noDefaultInfinity: true })).toThrowError();
    });
    describe('Is valid arbitrary?', () => {
      genericHelper.isValidArbitrary((ct?: FloatNextConstraints) => floatNext(ct), {
        isStrictlySmallerValue: (fa, fb) =>
          Math.abs(fa) < Math.abs(fb) ||
          (Object.is(fa, +0) && Object.is(fb, -0)) ||
          (Number.isNaN(fa) && !Number.isNaN(fb)),
        isValidValue: (g: number, ct?: FloatNextConstraints) => {
          if (typeof g !== 'number') return false; // should always produce numbers
          if (!is32bits(g)) return false; // should always produce 32-bit floats
          if (Number.isNaN(g)) {
            if (ct !== undefined && ct.noNaN) return false; // should not produce NaN if explicitely asked not too
            return true;
          }
          if (ct !== undefined && ct.min !== undefined && g < ct.min) return false; // should always be greater than min when specified
          if (ct !== undefined && ct.max !== undefined && g > ct.max) return false; // should always be smaller than max when specified
          if (ct !== undefined && ct.noDefaultInfinity) {
            if (ct.min === undefined && g === Number.NEGATIVE_INFINITY) return false; // should not produce -infinity when noInfity and min unset
            if (ct.max === undefined && g === Number.POSITIVE_INFINITY) return false; // should not produce +infinity when noInfity and max unset
          }
          return true;
        },
        seedGenerator: fc.option(floatNextConstraints(), { nil: undefined }),
      });
    });
  });*/

  describe('decomposeDouble (@internal)', () => {
    it('Should properly decompose basic values', () => {
      expect(decomposeDouble(0)).toEqual({ exponent: -1022, significand: 0 });
      expect(decomposeDouble(1)).toEqual({ exponent: 0, significand: 1 });
      expect(decomposeDouble(128)).toEqual({ exponent: 7, significand: 1 });
      expect(decomposeDouble(201)).toEqual({ exponent: 7, significand: 1.5703125 });
    });
    it('Should properly decompose negative values', () => {
      expect(decomposeDouble(-0)).toEqual({ exponent: -1022, significand: -0 });
      expect(decomposeDouble(-1)).toEqual({ exponent: 0, significand: -1 });
    });
    it('Should properly decompose extreme values', () => {
      expect(decomposeDouble(Number.MAX_VALUE)).toEqual({ exponent: 1023, significand: 2 - Number.EPSILON });
      expect(decomposeDouble(Number.MIN_VALUE)).toEqual({ exponent: -1022, significand: Number.EPSILON });
      expect(decomposeDouble(Number.EPSILON)).toEqual({ exponent: -52, significand: 1 });
      expect(decomposeDouble(1 + Number.EPSILON)).toEqual({ exponent: 0, significand: 1 + Number.EPSILON });
    });
    it('Should decompose a 64-bit float into its equivalent (significand, exponent)', () =>
      fc.assert(
        fc.property(float64raw(), (f64) => {
          fc.pre(!Number.isNaN(f64));
          const { exponent, significand } = decomposeDouble(f64);
          expect(significand * 2 ** exponent).toBe(f64);
        })
      ));
  });

  describe('doubleToIndex (@internal)', () => {
    it('Should always produce well-formed indexes', () =>
      fc.assert(
        fc.property(float64raw(), (d) => {
          fc.pre(!Number.isNaN(d));
          const index = doubleToIndex(d);
          expect(index.data[0]).toBeGreaterThanOrEqual(0);
          expect(index.data[0]).toBeLessThanOrEqual(0xffffffff);
          expect(Number.isInteger(index.data[0])).toBe(true);
          expect(index.data[1]).toBeGreaterThanOrEqual(0);
          expect(index.data[1]).toBeLessThanOrEqual(0xffffffff);
          expect(Number.isInteger(index.data[1])).toBe(true);
        })
      ));

    if (typeof BigInt === 'undefined') {
      it('no test', () => {
        expect(true).toBe(true);
      });
      return;
    } // Following tests require BigInt to be launched

    it('Should properly compute indexes', () => {
      expect(doubleToIndex(0)).toEqual(toIndex('0'));
      expect(doubleToIndex(Number.MIN_VALUE)).toEqual(toIndex('1'));
      expect(doubleToIndex(2 * Number.MIN_VALUE)).toEqual(toIndex('2'));
      expect(doubleToIndex(3 * Number.MIN_VALUE)).toEqual(toIndex('3'));
      // Last double with minimal exponent, ie -1022
      // index(last with min exponent) = 2**53 - 1
      expect(doubleToIndex(2 ** -1022 * (2 - Number.EPSILON))).toEqual(toIndex('9007199254740991'));
      // First double without minimal exponent, ie -1022
      // index(first without min exponent) = index(last with min exponent) + 1
      expect(doubleToIndex(2 ** -1021)).toEqual(toIndex('9007199254740992'));
      // Number.EPSILON === 1. * 2**-52 --> m = 1, e = -52
      // index(Number.EPSILON) = 2**53 + (-52 - (-1022) -1) * 2**52
      expect(doubleToIndex(Number.EPSILON)).toEqual(toIndex('4372995238176751616'));
      // index(1 - Number.EPSILON / 2) = index(1) - 1
      expect(doubleToIndex(1 - Number.EPSILON / 2)).toEqual(toIndex('4607182418800017407'));
      // 1 === 1. * 2**0 --> m = 1, e = 0
      // index(1) = 2**53 + (0 - (-1022) -1) * 2**52
      expect(doubleToIndex(1)).toEqual(toIndex('4607182418800017408'));
      // index(1 + Number.EPSILON) = index(1) + 1
      expect(doubleToIndex(1 + Number.EPSILON)).toEqual(toIndex('4607182418800017409'));
      // index(2 - Number.EPSILON) = index(2) - 1 = index(1 + (2 ** 52 - 1) * Number.EPSILON)
      expect(doubleToIndex(2 - Number.EPSILON)).toEqual(toIndex('4611686018427387903'));
      // 1 === 1. * 2**1 --> m = 1, e = 1
      // index(2) = index(1) + 2**52
      expect(doubleToIndex(2)).toEqual(toIndex('4611686018427387904'));
      // Number.MAX_VALUE === (1 + (2**52-1)/2**52) * 2**1023 --> m = 1 + (2**52-1)/2**52, e = 1023
      // index(Number.MAX_VALUE) = index(next(Number.MAX_VALUE)) -1 = 2**53 + (1024 - (-1022) -1) * 2**52 -1
      expect(doubleToIndex(Number.MAX_VALUE)).toEqual(toIndex('9218868437227405311'));
    });
    it('Should properly compute negative indexes', () => {
      expect(doubleToIndex(-0)).toEqual(toIndex('-1'));
      expect(doubleToIndex(-Number.MIN_VALUE)).toEqual(toIndex('-2'));
      expect(doubleToIndex(-Number.MAX_VALUE)).toEqual(toIndex('-9218868437227405312'));
    });
    it('Should properly compute indexes for infinity', () => {
      expect(doubleToIndex(Number.NEGATIVE_INFINITY)).toEqual(
        toIndex(toBigInt(doubleToIndex(-Number.MAX_VALUE)) - BigInt(1))
      );
      expect(doubleToIndex(Number.POSITIVE_INFINITY)).toEqual(
        toIndex(toBigInt(doubleToIndex(Number.MAX_VALUE)) + BigInt(1))
      );
    });
    it('Should be able to infer index for negative double from the positive one', () =>
      fc.assert(
        fc.property(float64raw(), (d) => {
          fc.pre(!Number.isNaN(d));
          const posD = d > 0 || 1 / d > 0 ? d : -d;
          const bigIntIndexPos = toBigInt(doubleToIndex(posD));
          const bigIntIndexNeg = toBigInt(doubleToIndex(-posD));
          expect(bigIntIndexNeg).toEqual(-bigIntIndexPos - BigInt(1));
        })
      ));
    it('Should return index +1 for the successor of a given double', () =>
      fc.assert(
        fc.property(
          fc.integer({ min: -1022, max: +1023 }),
          fc.integer({ min: 0, max: 2 ** 53 - 1 }),
          (exponent, rescaledSignificand) => {
            fc.pre(exponent === -1022 || rescaledSignificand >= 2 ** 52); // valid
            fc.pre(exponent !== 1023 || rescaledSignificand !== 2 ** 53 - 1); // not max
            const current = rescaledSignificand * Number.EPSILON * 2 ** exponent;
            const next = (rescaledSignificand + 1) * Number.EPSILON * 2 ** exponent;
            const bigIntIndexCurrent = toBigInt(doubleToIndex(current));
            const bigIntIndexNext = toBigInt(doubleToIndex(next));
            expect(bigIntIndexNext).toEqual(bigIntIndexCurrent + BigInt(1));
          }
        )
      ));
    it('Should preserve ordering between two doubles', () =>
      fc.assert(
        fc.property(float64raw(), float64raw(), (fa64, fb64) => {
          fc.pre(!Number.isNaN(fa64) && !Number.isNaN(fb64));
          if (isStrictlySmaller(fa64, fb64)) {
            expect(toBigInt(doubleToIndex(fa64))).toBeLessThan(toBigInt(doubleToIndex(fb64)));
          } else {
            expect(toBigInt(doubleToIndex(fa64))).toBeGreaterThanOrEqual(toBigInt(doubleToIndex(fb64)));
          }
        })
      ));
  });

  describe('indexToDouble (@internal)', () => {
    it('Should reverse doubleToIndex', () =>
      fc.assert(
        fc.property(float64raw(), (f64) => {
          fc.pre(!Number.isNaN(f64));
          expect(indexToDouble(doubleToIndex(f64))).toBe(f64);
        })
      ));

    if (typeof BigInt === 'undefined') {
      it('no test', () => {
        expect(true).toBe(true);
      });
      return;
    } // Following tests require BigInt to be launched

    it('Should properly find doubles corresponding to well-known values', () => {
      expect(indexToDouble(toIndex('-9218868437227405313'))).toBe(Number.NEGATIVE_INFINITY);
      expect(indexToDouble(toIndex('-9218868437227405312'))).toBe(-Number.MAX_VALUE);
      expect(indexToDouble(toIndex('-1'))).toBe(-0);
      expect(indexToDouble(toIndex('0'))).toBe(0);
      expect(indexToDouble(toIndex('4372995238176751616'))).toBe(Number.EPSILON);
      expect(indexToDouble(toIndex('9218868437227405311'))).toBe(Number.MAX_VALUE);
      expect(indexToDouble(toIndex('9218868437227405312'))).toBe(Number.POSITIVE_INFINITY);
    });
    it('Should be reversed by doubleToIndex', () =>
      fc.assert(
        fc.property(
          fc.bigInt({ min: BigInt('-9218868437227405313'), max: BigInt('9218868437227405312') }),
          (bigIntIndex) => {
            // The test below checks that indexToDouble(doubleToIndex) is identity
            // It does not confirm that doubleToIndex(indexToDouble)) is identity
            const index = toIndex(bigIntIndex);
            expect(doubleToIndex(indexToDouble(index))).toEqual(index);
          }
        )
      ));
  });
});

import * as fc from '../../../../lib/fast-check';
import { DoubleNextConstraints } from '../../../../src/arbitrary/_next/doubleNext';
import { FloatNextConstraints } from '../../../../src/arbitrary/_next/floatNext';

export function float32raw(): fc.Arbitrary<number> {
  return fc.integer().map((n32) => new Float32Array(new Int32Array([n32]).buffer)[0]);
}

export function float64raw(): fc.Arbitrary<number> {
  return fc
    .tuple(fc.integer(), fc.integer())
    .map(([na32, nb32]) => new Float64Array(new Int32Array([na32, nb32]).buffer)[0]);
}

export const defaultFloatRecordConstraints = {
  min: float32raw(),
  max: float32raw(),
  noDefaultInfinity: fc.boolean(),
  noNaN: fc.boolean(),
};

export const defaultDoubleRecordConstraints = {
  min: float64raw(),
  max: float64raw(),
  noDefaultInfinity: fc.boolean(),
  noNaN: fc.boolean(),
};

type NextConstraintsInternalOut = FloatNextConstraints & DoubleNextConstraints;
type NextConstraintsInternal = {
  [K in keyof NextConstraintsInternalOut]?: fc.Arbitrary<NextConstraintsInternalOut[K]>;
};
function nextConstraintsInternal(recordConstraints: NextConstraintsInternal): fc.Arbitrary<NextConstraintsInternalOut> {
  return fc
    .record(recordConstraints, { withDeletedKeys: true })
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
}

export function floatNextConstraints(
  recordConstraints: Partial<typeof defaultFloatRecordConstraints> = defaultFloatRecordConstraints
): fc.Arbitrary<FloatNextConstraints> {
  return nextConstraintsInternal(recordConstraints);
}

export function doubleNextConstraints(
  recordConstraints: Partial<typeof defaultDoubleRecordConstraints> = defaultDoubleRecordConstraints
): fc.Arbitrary<DoubleNextConstraints> {
  return nextConstraintsInternal(recordConstraints);
}

export function isStrictlySmaller(fa: number, fb: number): boolean {
  if (fa === 0 && fb === 0) return 1 / fa < 1 / fb;
  return fa < fb;
}

export function is32bits(f64: number): boolean {
  return Object.is(new Float32Array([f64])[0], f64);
}

export function isNotNaN32bits(f64: number): boolean {
  return !Number.isNaN(f64) && is32bits(f64);
}

export function isFiniteNotNaN32bits(f64: number): boolean {
  return Number.isFinite(f64) && isNotNaN32bits(f64);
}

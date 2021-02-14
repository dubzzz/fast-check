/** @internal */
export type ArrayInt64 = { sign: 1 | -1; data: [number, number] };

/** @internal */
export const Zero64: ArrayInt64 = { sign: 1, data: [0, 0] };

/** @internal */
export const Unit64: ArrayInt64 = { sign: 1, data: [0, 1] };

/** @internal */
export function isZero64(a: ArrayInt64): boolean {
  return a.data[0] === 0 && a.data[1] === 0;
}

/** @internal */
export function isStrictlyNegative64(a: ArrayInt64): boolean {
  return a.sign === -1 && !isZero64(a);
}

/** @internal */
export function isStrictlyPositive64(a: ArrayInt64): boolean {
  return a.sign === 1 && !isZero64(a);
}

/** @internal */
export function isEqual64(a: ArrayInt64, b: ArrayInt64): boolean {
  if (a.data[0] === b.data[0] && a.data[1] === b.data[1]) {
    return a.sign === b.sign || (a.data[0] === 0 && a.data[1] === 0); // either the same or both zero
  }
  return false;
}

/** @internal */
function isStrictlySmaller64Internal(a: ArrayInt64['data'], b: ArrayInt64['data']): boolean {
  return a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]);
}

/** @internal */
export function isStrictlySmaller64(a: ArrayInt64, b: ArrayInt64): boolean {
  if (a.sign === b.sign) {
    return a.sign === 1
      ? isStrictlySmaller64Internal(a.data, b.data) // a.sign = +1, b.sign = +1
      : isStrictlySmaller64Internal(b.data, a.data); // a.sign = -1, b.sign = -1
  }
  // a.sign = +1, b.sign = -1 is always false
  return a.sign === -1 && (!isZero64(a) || !isZero64(b)); // a.sign = -1, b.sign = +1
}

/** @internal */
export function clone64(a: ArrayInt64): ArrayInt64 {
  return { sign: a.sign, data: [a.data[0], a.data[1]] };
}

/** @internal */
function substract64DataInternal(a: ArrayInt64['data'], b: ArrayInt64['data']): ArrayInt64['data'] {
  let reminderLow = 0;
  let low = a[1] - b[1];
  if (low < 0) {
    reminderLow = 1;
    low = low >>> 0;
  }
  return [a[0] - b[0] - reminderLow, low];
}

/**
 * Expects a >= b
 * @internal
 */
function substract64Internal(a: ArrayInt64, b: ArrayInt64): ArrayInt64 {
  if (a.sign === 1 && b.sign === -1) {
    // Operation is a simple sum of a + abs(b)
    const low = a.data[1] + b.data[1];
    const high = a.data[0] + b.data[0] + (low > 0xffffffff ? 1 : 0);
    return { sign: 1, data: [high >>> 0, low >>> 0] };
  }

  // a.sign === -1 with b.sign === 1 is impossible given: a - b >= 0, except for a = 0 and b = 0
  // Operation is a substraction
  return {
    sign: 1,
    data: a.sign === 1 ? substract64DataInternal(a.data, b.data) : substract64DataInternal(b.data, a.data),
  };
}

/**
 * Substract two ArrayInt64
 * @returns When result is zero always with sign=1
 * @internal
 */
export function substract64(arrayIntA: ArrayInt64, arrayIntB: ArrayInt64): ArrayInt64 {
  if (isStrictlySmaller64(arrayIntA, arrayIntB)) {
    const out = substract64Internal(arrayIntB, arrayIntA);
    out.sign = -1;
    return out;
  }
  return substract64Internal(arrayIntA, arrayIntB);
}

/**
 * Negative version of an ArrayInt64
 * @internal
 */
export function negative64(arrayIntA: ArrayInt64): ArrayInt64 {
  return {
    sign: -arrayIntA.sign as -1 | 1,
    data: [arrayIntA.data[0], arrayIntA.data[1]],
  };
}

/**
 * Add two ArrayInt64
 * @returns When result is zero always with sign=1
 * @internal
 */
export function add64(arrayIntA: ArrayInt64, arrayIntB: ArrayInt64): ArrayInt64 {
  if (isZero64(arrayIntB)) {
    if (isZero64(arrayIntA)) {
      return clone64(Zero64);
    }
    return clone64(arrayIntA);
  }
  return substract64(arrayIntA, negative64(arrayIntB));
}

/**
 * Halve an ArrayInt64
 * @internal
 */
export function halve64(a: ArrayInt64): ArrayInt64 {
  return {
    sign: a.sign,
    data: [Math.floor(a.data[0] / 2), (a.data[0] % 2 === 1 ? 0x80000000 : 0) + Math.floor(a.data[1] / 2)],
  };
}

/**
 * Apply log2 to an ArrayInt64 (preserve sign)
 * @internal
 */
export function logLike64(a: ArrayInt64): ArrayInt64 {
  // Math.floor(Math.log(hi * 2**32 + low) / Math.log(2)) <= Math.floor(Math.log(2**64) / Math.log(2)) = 64
  return {
    sign: a.sign,
    data: [0, Math.floor(Math.log(a.data[0] * 0x100000000 + a.data[1]) / Math.log(2))],
  };
}

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
export function isStrictlySmaller64(a: ArrayInt64, b: ArrayInt64): boolean {
  if (a.sign === b.sign) {
    if (a.sign === 1) {
      // a.sign = +1, b.sign = +1
      return a.data[0] < b.data[0] || (a.data[0] === b.data[0] && a.data[1] < b.data[1]);
    }
    // a.sign = -1, b.sign = -1
    return b.data[0] < a.data[0] || (b.data[0] === a.data[0] && b.data[1] < a.data[1]);
  }
  if (a.sign === 1) {
    // a.sign = +1, b.sign = -1
    return false;
  }
  // a.sign = -1, b.sign = +1
  return !isZero64(a) || !isZero64(b);
}

/** @internal */
function substract64Internal(arrayIntA: ArrayInt64, arrayIntB: ArrayInt64): ArrayInt64 {
  // WARNING: We expect arrayIntA >= arrayIntB
  //          In the code of this helper

  const lowA = arrayIntA.data[1];
  const highA = arrayIntA.data[0];
  const signA = arrayIntA.sign;
  const lowB = arrayIntB.data[1];
  const highB = arrayIntB.data[0];
  const signB = arrayIntB.sign;

  if (signA === 1 && signB === -1) {
    // Operation is a simple sum of arrayIntA + abs(arrayIntB)
    const low = lowA + lowB;
    const high = highA + highB + (low > 0xffffffff ? 1 : 0);
    return { sign: 1, data: [high >>> 0, low >>> 0] };
  }

  // signA === -1 with signB === 1 is impossible given: arrayIntA - arrayIntB >= 0
  // Operation is a substraction
  let lowFirst = lowA;
  let highFirst = highA;
  let lowSecond = lowB;
  let highSecond = highB;
  if (signA === -1) {
    lowFirst = lowB;
    highFirst = highB;
    lowSecond = lowA;
    highSecond = highA;
  }
  let reminderLow = 0;
  let low = lowFirst - lowSecond;
  if (low < 0) {
    reminderLow = 1;
    low = low >>> 0;
  }
  return { sign: 1, data: [highFirst - highSecond - reminderLow, low] };
}

/** @internal */
export function substract64(arrayIntA: ArrayInt64, arrayIntB: ArrayInt64): ArrayInt64 {
  if (isStrictlySmaller64(arrayIntA, arrayIntB)) {
    const out = substract64Internal(arrayIntB, arrayIntA);
    out.sign = -1;
    return out;
  }
  return substract64Internal(arrayIntA, arrayIntB);
}

/** @internal */
export function negative64(arrayIntA: ArrayInt64): ArrayInt64 {
  return {
    sign: -arrayIntA.sign as -1 | 1,
    data: [arrayIntA.data[0], arrayIntA.data[1]],
  };
}

/** @internal */
export function add64(arrayIntA: ArrayInt64, arrayIntB: ArrayInt64): ArrayInt64 {
  if (isZero64(arrayIntB)) {
    return { sign: arrayIntA.sign, data: [arrayIntA.data[0], arrayIntA.data[1]] };
  }
  return substract64(arrayIntA, negative64(arrayIntB));
}

/** @internal */
export function halve64(a: ArrayInt64): ArrayInt64 {
  return {
    sign: a.sign,
    data: [Math.floor(a.data[0] / 2), (a.data[0] % 2 === 1 ? 0x80000000 : 0) + Math.floor(a.data[1] / 2)],
  };
}

/** @internal */
export function logLike64(a: ArrayInt64): ArrayInt64 {
  // Math.floor(Math.log(hi * 2**32 + low) / Math.log(2)) <= Math.floor(Math.log(2**64) / Math.log(2)) = 64
  return {
    sign: a.sign,
    data: [0, Math.floor(Math.log(a.data[1] * 0x100000000 + a.data[0]) / Math.log(2))],
  };
}

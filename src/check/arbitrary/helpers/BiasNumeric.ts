/** @internal */
function retrieveBiasRangesForNumeric(
  min: number,
  max: number,
  logLike: (n: number) => number
): { min: number; max: number }[];
function retrieveBiasRangesForNumeric(
  min: bigint,
  max: bigint,
  logLike: (n: bigint) => bigint
): { min: bigint; max: bigint }[];
function retrieveBiasRangesForNumeric<NType extends number | bigint>(
  min: NType,
  max: NType,
  logLike: (n: NType) => NType
): { min: NType; max: NType }[] {
  if (min === max) {
    return [{ min: min, max: max }];
  }
  if (min < 0 && max > 0) {
    // min < 0 && max > 0
    const logMin = logLike(-min as any); // min !== 0
    const logMax = logLike(max); // max !== 0
    return [
      { min: -logMin as any, max: logMax }, // close to zero,
      { min: (max - logMax) as any, max: max }, // close to max
      { min: min, max: (min as any) + logMin }, // close to min
    ];
  }
  // Either min < 0 && max <= 0
  // Or min >= 0, so max >= 0
  const logGap = logLike((max - min) as any); // max-min !== 0
  const arbCloseToMin = { min: min, max: (min as any) + logGap }; // close to min
  const arbCloseToMax = { min: (max - logGap) as any, max: max }; // close to max
  return min < 0
    ? [arbCloseToMax, arbCloseToMin] // max is closer to zero
    : [arbCloseToMin, arbCloseToMax]; // min is closer to zero
}

export { retrieveBiasRangesForNumeric };

/** @internal */
export function integerLogLike(v: number): number {
  return Math.floor(Math.log(v) / Math.log(2));
}

/** @internal */
export function bigIntLogLike(v: bigint): bigint {
  if (v === BigInt(0)) return BigInt(0);
  return BigInt(v.toString().length);
}

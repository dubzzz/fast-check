import { Stream, stream } from '../../../stream/Stream';

/** @internal */
type Numeric = number | bigint;

/**
 * @internal
 * Compute shrunk values to move from current to target
 */
function shrinkNumericInternal<NType extends Numeric>(
  current: NType,
  target: NType,
  shrunkOnce: boolean,
  halvePos: (n: NType) => NType,
  halveNeg: (n: NType) => NType
): Stream<NType> {
  const realGap: NType = (current - target) as any;
  function* shrinkDecr(): IterableIterator<NType> {
    const gap = shrunkOnce ? halvePos(realGap) : realGap;
    for (let toremove = gap; toremove > 0; toremove = halvePos(toremove)) {
      yield (current - toremove) as any;
    }
  }
  function* shrinkIncr(): IterableIterator<NType> {
    const gap = shrunkOnce ? halveNeg(realGap) : realGap;
    for (let toremove = gap; toremove < 0; toremove = halveNeg(toremove)) {
      yield (current - toremove) as any;
    }
  }
  return realGap > 0 ? stream(shrinkDecr()) : stream(shrinkIncr());
}

/**
 * @internal
 * Halve towards zero
 */
function halveBigInt(n: bigint): bigint {
  return n / BigInt(2);
}
/** @internal */
function halvePosNumber(n: number): number {
  return Math.floor(n / 2);
}
/** @internal */
function halveNegNumber(n: number): number {
  return Math.ceil(n / 2);
}

/**
 * @internal
 * Compute shrunk values for current given the accepted range
 * If the range includes zero, the shrunk values will target zero
 * Otherwise they will target the min or max depending which one is closer to zero
 */
function shrinkNumeric<NType extends Numeric>(
  zero: NType,
  min: NType,
  max: NType,
  current: NType,
  shrunkOnce: boolean,
  halvePos: (n: NType) => NType,
  halveNeg: (n: NType) => NType
) {
  if (min <= zero && max >= zero) {
    return shrinkNumericInternal(current, zero, shrunkOnce, halvePos, halveNeg);
  }
  return current < zero
    ? shrinkNumericInternal(current, max, shrunkOnce, halvePos, halveNeg)
    : shrinkNumericInternal(current, min, shrunkOnce, halvePos, halveNeg);
}

/** @internal */
export function shrinkNumber(min: number, max: number, current: number, shrunkOnce: boolean) {
  return shrinkNumeric(0, min, max, current, shrunkOnce, halvePosNumber, halveNegNumber);
}

/** @internal */
export function shrinkBigInt(min: bigint, max: bigint, current: bigint, shrunkOnce: boolean) {
  return shrinkNumeric(BigInt(0), min, max, current, shrunkOnce, halveBigInt, halveBigInt);
}

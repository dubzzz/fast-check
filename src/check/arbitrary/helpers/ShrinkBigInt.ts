import { Stream, stream } from '../../../stream/Stream';

/**
 * Halve towards zero
 * @internal
 */
function halveBigInt(n: bigint): bigint {
  return n / BigInt(2);
}

/**
 * Compute shrunk values to move from current to target
 * @internal
 */
function shrinkBigIntInternal(current: bigint, target: bigint, shrunkOnce: boolean): Stream<bigint> {
  const realGap = current - target;
  function* shrinkDecr(): IterableIterator<bigint> {
    const gap = shrunkOnce ? halveBigInt(realGap) : realGap;
    for (let toremove = gap; toremove > 0; toremove = halveBigInt(toremove)) {
      yield current - toremove;
    }
  }
  function* shrinkIncr(): IterableIterator<bigint> {
    const gap = shrunkOnce ? halveBigInt(realGap) : realGap;
    for (let toremove = gap; toremove < 0; toremove = halveBigInt(toremove)) {
      yield current - toremove;
    }
  }
  return realGap > 0 ? stream(shrinkDecr()) : stream(shrinkIncr());
}

/** @internal */
export function shrinkBigInt(min: bigint, max: bigint, current: bigint, shrunkOnce: boolean): Stream<bigint> {
  return min <= 0 && max >= 0
    ? shrinkBigIntInternal(current, BigInt(0), shrunkOnce)
    : current < 0
    ? shrinkBigIntInternal(current, max, shrunkOnce)
    : shrinkBigIntInternal(current, min, shrunkOnce);
}

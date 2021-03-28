import { Stream, stream } from '../../../stream/Stream';
import { NextValue } from '../definition/NextValue';

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
export function shrinkBigInt(current: bigint, target: bigint, tryTargetAsap: boolean): Stream<NextValue<bigint>> {
  const realGap = current - target;
  function* shrinkDecr(): IterableIterator<NextValue<bigint>> {
    let previous: bigint | undefined = tryTargetAsap ? undefined : target;
    const gap = tryTargetAsap ? realGap : halveBigInt(realGap);
    for (let toremove = gap; toremove > 0; toremove = halveBigInt(toremove)) {
      const next = current - toremove;
      yield new NextValue(next, previous); // previous indicates the last passing value
      previous = next;
    }
  }
  function* shrinkIncr(): IterableIterator<NextValue<bigint>> {
    let previous: bigint | undefined = tryTargetAsap ? undefined : target;
    const gap = tryTargetAsap ? realGap : halveBigInt(realGap);
    for (let toremove = gap; toremove < 0; toremove = halveBigInt(toremove)) {
      const next = current - toremove;
      yield new NextValue(next, previous); // previous indicates the last passing value
      previous = next;
    }
  }
  return realGap > 0 ? stream(shrinkDecr()) : stream(shrinkIncr());
}

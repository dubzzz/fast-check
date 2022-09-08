import { Stream, stream } from '../../../stream/Stream';
import { Value } from '../../../check/arbitrary/definition/Value';

const SBigInt = BigInt;

/**
 * Halve towards zero
 * @internal
 */
function halveBigInt(n: bigint): bigint {
  return n / SBigInt(2);
}

/**
 * Compute shrunk values to move from current to target
 * @internal
 */
export function shrinkBigInt(current: bigint, target: bigint, tryTargetAsap: boolean): Stream<Value<bigint>> {
  const realGap = current - target;
  function* shrinkDecr(): IterableIterator<Value<bigint>> {
    let previous: bigint | undefined = tryTargetAsap ? undefined : target;
    const gap = tryTargetAsap ? realGap : halveBigInt(realGap);
    for (let toremove = gap; toremove > 0; toremove = halveBigInt(toremove)) {
      const next = current - toremove;
      yield new Value(next, previous); // previous indicates the last passing value
      previous = next;
    }
  }
  function* shrinkIncr(): IterableIterator<Value<bigint>> {
    let previous: bigint | undefined = tryTargetAsap ? undefined : target;
    const gap = tryTargetAsap ? realGap : halveBigInt(realGap);
    for (let toremove = gap; toremove < 0; toremove = halveBigInt(toremove)) {
      const next = current - toremove;
      yield new Value(next, previous); // previous indicates the last passing value
      previous = next;
    }
  }
  return realGap > 0 ? stream(shrinkDecr()) : stream(shrinkIncr());
}

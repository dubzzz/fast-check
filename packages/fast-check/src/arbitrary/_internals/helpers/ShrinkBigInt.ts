import { Value } from '../../../check/arbitrary/definition/Value.js';

/**
 * Halve towards zero
 * @internal
 */
function halveBigInt(n: bigint): bigint {
  return n / 2n;
}

/**
 * Compute shrunk values to move from current to target
 * @internal
 */
export function shrinkBigInt(current: bigint, target: bigint, tryTargetAsap: boolean): IteratorObject<Value<bigint>> {
  const realGap = current - target;
  function* shrinkDecr(): IteratorObject<Value<bigint>> {
    let previous: bigint | undefined = tryTargetAsap ? undefined : target;
    const gap = tryTargetAsap ? realGap : halveBigInt(realGap);
    for (let toremove = gap; toremove > 0; toremove = halveBigInt(toremove)) {
      const next = current - toremove;
      yield new Value(next, previous); // previous indicates the last passing value
      previous = next;
    }
    return undefined;
  }
  function* shrinkIncr(): IteratorObject<Value<bigint>> {
    let previous: bigint | undefined = tryTargetAsap ? undefined : target;
    const gap = tryTargetAsap ? realGap : halveBigInt(realGap);
    for (let toremove = gap; toremove < 0; toremove = halveBigInt(toremove)) {
      const next = current - toremove;
      yield new Value(next, previous); // previous indicates the last passing value
      previous = next;
    }
    return undefined;
  }
  return realGap > 0 ? shrinkDecr() : shrinkIncr();
}

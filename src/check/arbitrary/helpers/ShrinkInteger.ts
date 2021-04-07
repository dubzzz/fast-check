import { Stream, stream } from '../../../stream/Stream';
import { NextValue } from '../definition/NextValue';

/** @internal */
function halvePosInteger(n: number): number {
  return Math.floor(n / 2);
}
/** @internal */
function halveNegInteger(n: number): number {
  return Math.ceil(n / 2);
}

/**
 * Compute shrunk values to move from current to target
 * @internal
 */
export function shrinkInteger(current: number, target: number, tryTargetAsap: boolean): Stream<NextValue<number>> {
  const realGap = current - target;
  function* shrinkDecr(): IterableIterator<NextValue<number>> {
    let previous: number | undefined = tryTargetAsap ? undefined : target;
    const gap = tryTargetAsap ? realGap : halvePosInteger(realGap);
    for (let toremove = gap; toremove > 0; toremove = halvePosInteger(toremove)) {
      const next = current - toremove;
      yield new NextValue(next, previous); // previous indicates the last passing value
      previous = next;
    }
  }
  function* shrinkIncr(): IterableIterator<NextValue<number>> {
    let previous: number | undefined = tryTargetAsap ? undefined : target;
    const gap = tryTargetAsap ? realGap : halveNegInteger(realGap);
    for (let toremove = gap; toremove < 0; toremove = halveNegInteger(toremove)) {
      const next = current - toremove;
      yield new NextValue(next, previous); // previous indicates the last passing value
      previous = next;
    }
  }
  return realGap > 0 ? stream(shrinkDecr()) : stream(shrinkIncr());
}

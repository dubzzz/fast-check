import { Stream, stream } from '../../../stream/Stream';

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
function shrinkIntegerInternal(current: number, target: number, shrunkOnce: boolean): Stream<number> {
  const realGap = current - target;
  function* shrinkDecr(): IterableIterator<number> {
    const gap = shrunkOnce ? halvePosInteger(realGap) : realGap;
    for (let toremove = gap; toremove > 0; toremove = halvePosInteger(toremove)) {
      yield current - toremove;
    }
  }
  function* shrinkIncr(): IterableIterator<number> {
    const gap = shrunkOnce ? halveNegInteger(realGap) : realGap;
    for (let toremove = gap; toremove < 0; toremove = halveNegInteger(toremove)) {
      yield current - toremove;
    }
  }
  return realGap > 0 ? stream(shrinkDecr()) : stream(shrinkIncr());
}

/** @internal */
export function shrinkInteger(min: number, max: number, current: number, shrunkOnce: boolean): Stream<number> {
  return min <= 0 && max >= 0
    ? shrinkIntegerInternal(current, 0, shrunkOnce)
    : current < 0
    ? shrinkIntegerInternal(current, max, shrunkOnce)
    : shrinkIntegerInternal(current, min, shrunkOnce);
}

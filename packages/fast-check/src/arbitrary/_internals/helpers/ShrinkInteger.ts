import { Value } from '../../../check/arbitrary/definition/Value.js';
import { Stream } from '../../../stream/Stream.js';

const safeMathCeil = Math.ceil;
const safeMathFloor = Math.floor;

/** @internal */
function halvePosInteger(n: number): number {
  return safeMathFloor(n / 2);
}
/** @internal */
function halveNegInteger(n: number): number {
  return safeMathCeil(n / 2);
}
/** @internal */
function positiveStopAtZero(n: number): boolean {
  return n <= 0;
}
/** @internal */
function negativeStopAtZero(n: number): boolean {
  return n >= 0;
}

/**
 * Manual iterator that yields shrunk integer values.
 * Avoids the closure-per-call cost of using a `function*` generator.
 * @internal
 */
class ShrinkIntegerIterator implements IterableIterator<Value<number>> {
  private toremove: number;
  private previous: number | undefined;
  // direction: +1 for shrinkDecr (positive gap, halve floor),
  // -1 for shrinkIncr (negative gap, halve ceil)
  private readonly halve: (n: number) => number;
  private readonly stopAtZero: (n: number) => boolean;
  private readonly current: number;
  private readonly target: number;
  private readonly realGap: number;
  constructor(current: number, target: number, tryTargetAsap: boolean, realGap: number) {
    this.current = current;
    this.target = target;
    this.realGap = realGap;
    this.previous = tryTargetAsap ? undefined : target;
    if (realGap > 0) {
      this.halve = halvePosInteger;
      this.stopAtZero = positiveStopAtZero;
    } else {
      this.halve = halveNegInteger;
      this.stopAtZero = negativeStopAtZero;
    }
    this.toremove = tryTargetAsap ? realGap : this.halve(realGap);
  }
  next(): IteratorResult<Value<number>> {
    const toremove = this.toremove;
    if (this.stopAtZero(toremove)) {
      return { value: undefined, done: true };
    }
    // The check toremove === realGap ensures we will not face any overflow
    // for values like - current=4489181317763721 and target=-5692628479909134 - we overflow in realGap
    const next = toremove === this.realGap ? this.target : this.current - toremove;
    const v = new Value(next, this.previous);
    this.previous = next;
    this.toremove = this.halve(toremove);
    return { value: v, done: false };
  }
  [Symbol.iterator](): IterableIterator<Value<number>> {
    return this;
  }
}

/**
 * Compute shrunk values to move from current to target
 * @internal
 */
export function shrinkInteger(current: number, target: number, tryTargetAsap: boolean): Stream<Value<number>> {
  const realGap = current - target;
  return new Stream(new ShrinkIntegerIterator(current, target, tryTargetAsap, realGap));
}

import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import { cloneMethod } from '../../check/symbols';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { safeMap, safePush } from '../../utils/globals';

const safeIsArray = Array.isArray;
const safeObjectIs = Object.is;

/** @internal */
export class CloneArbitrary<T> extends Arbitrary<T[]> {
  constructor(readonly arb: Arbitrary<T>, readonly numValues: number) {
    super();
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<T[]> {
    const items: Value<T>[] = [];
    if (this.numValues <= 0) {
      return this.wrapper(items);
    }
    // We call generate multiple times to have fully independent values
    for (let idx = 0; idx !== this.numValues - 1; ++idx) {
      safePush(items, this.arb.generate(mrng.clone(), biasFactor));
    }
    safePush(items, this.arb.generate(mrng, biasFactor));
    return this.wrapper(items);
  }

  canShrinkWithoutContext(value: unknown): value is T[] {
    if (!safeIsArray(value) || value.length !== this.numValues) {
      return false;
    }
    if (value.length === 0) {
      return true;
    }
    for (let index = 1; index < value.length; ++index) {
      if (!safeObjectIs(value[0], value[index])) {
        // We don't relally know:
        // >  Properly implementing canShrinkWithoutContext for general case is really complex.
        // >  If values generated by `this.arb` cannot be compared using `Object.is` then the check is impossible.
        return false;
      }
    }
    return this.arb.canShrinkWithoutContext(value[0]);
  }

  shrink(value: T[], context?: unknown): Stream<Value<T[]>> {
    if (value.length === 0) {
      return Stream.nil();
    }
    return new Stream(this.shrinkImpl(value, context !== undefined ? (context as unknown[]) : [])).map((v) =>
      this.wrapper(v)
    );
  }

  private *shrinkImpl(value: T[], contexts: unknown[]): IterableIterator<Value<T>[]> {
    const its = safeMap(value, (v, idx) => this.arb.shrink(v, contexts[idx])[Symbol.iterator]());
    let cur = safeMap(its, (it) => it.next());
    while (!cur[0].done) {
      yield safeMap(cur, (c) => c.value);
      cur = safeMap(its, (it) => it.next());
    }
  }

  private static makeItCloneable<T>(vs: T[], shrinkables: Value<T>[]) {
    (vs as any)[cloneMethod] = () => {
      const cloned: T[] = [];
      for (let idx = 0; idx !== shrinkables.length; ++idx) {
        safePush(cloned, shrinkables[idx].value); // push potentially cloned values
      }
      this.makeItCloneable(cloned, shrinkables);
      return cloned;
    };
    return vs;
  }

  private wrapper(items: Value<T>[]): Value<T[]> {
    let cloneable = false;
    const vs: T[] = [];
    const contexts: unknown[] = [];
    for (let idx = 0; idx !== items.length; ++idx) {
      const s = items[idx];
      cloneable = cloneable || s.hasToBeCloned;
      safePush(vs, s.value);
      safePush(contexts, s.context);
    }
    if (cloneable) {
      CloneArbitrary.makeItCloneable(vs, items);
    }
    return new Value(vs, contexts);
  }
}

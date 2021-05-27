import { NextArbitrary } from '../../check/arbitrary/definition/NextArbitrary';
import { NextValue } from '../../check/arbitrary/definition/NextValue';
import { cloneMethod } from '../../check/symbols';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';

/** @internal */
export class CloneArbitrary<T> extends NextArbitrary<T[]> {
  constructor(readonly arb: NextArbitrary<T>, readonly numValues: number) {
    super();
  }

  generate(mrng: Random, biasFactor: number | undefined): NextValue<T[]> {
    const items: NextValue<T>[] = [];
    if (this.numValues <= 0) {
      return this.wrapper(items);
    }
    // We call generate multiple times to have fully independent values
    for (let idx = 0; idx !== this.numValues - 1; ++idx) {
      items.push(this.arb.generate(mrng.clone(), biasFactor));
    }
    items.push(this.arb.generate(mrng, biasFactor));
    return this.wrapper(items);
  }

  canShrinkWithoutContext(value: unknown): value is T[] {
    if (!Array.isArray(value) || value.length !== this.numValues) {
      return false;
    }
    if (value.length === 0) {
      return true;
    }
    for (let index = 1; index < value.length; ++index) {
      if (!Object.is(value[0], value[index])) {
        // We don't relally know:
        // >  Properly implementing canShrinkWithoutContext for general case is really complex.
        // >  If values generated by `this.arb` cannot be compared using `Object.is` then the check is impossible.
        return false;
      }
    }
    return this.arb.canShrinkWithoutContext(value[0]);
  }

  shrink(value: T[], context?: unknown): Stream<NextValue<T[]>> {
    if (value.length === 0) {
      return Stream.nil();
    }
    return new Stream(this.shrinkImpl(value, context !== undefined ? (context as unknown[]) : [])).map((v) =>
      this.wrapper(v)
    );
  }

  private *shrinkImpl(value: T[], contexts: unknown[]): IterableIterator<NextValue<T>[]> {
    const its = value.map((v, idx) => this.arb.shrink(v, contexts[idx])[Symbol.iterator]());
    let cur = its.map((it) => it.next());
    while (!cur[0].done) {
      yield cur.map((c) => c.value);
      cur = its.map((it) => it.next());
    }
  }

  private static makeItCloneable<T>(vs: T[], shrinkables: NextValue<T>[]) {
    (vs as any)[cloneMethod] = () => {
      const cloned = [];
      for (let idx = 0; idx !== shrinkables.length; ++idx) {
        cloned.push(shrinkables[idx].value); // push potentially cloned values
      }
      this.makeItCloneable(cloned, shrinkables);
      return cloned;
    };
    return vs;
  }

  private wrapper(items: NextValue<T>[]): NextValue<T[]> {
    let cloneable = false;
    const vs: T[] = [];
    const contexts: unknown[] = [];
    for (let idx = 0; idx !== items.length; ++idx) {
      const s = items[idx];
      cloneable = cloneable || s.hasToBeCloned;
      vs.push(s.value);
      contexts.push(s.context);
    }
    if (cloneable) {
      CloneArbitrary.makeItCloneable(vs, items);
    }
    return new NextValue(vs, contexts);
  }
}

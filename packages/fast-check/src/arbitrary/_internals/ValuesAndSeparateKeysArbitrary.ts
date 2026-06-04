import type { Random } from '../../random/generator/Random.js';
import { Stream } from '../../stream/Stream.js';
import { makeLazy } from '../../stream/LazyIterableIterator.js';
import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary.js';
import { Value } from '../../check/arbitrary/definition/Value.js';
import { cloneMethod, hasCloneMethod } from '../../check/symbols.js';
import { safePush, safeSlice } from '../../utils/globals.js';

const safeObjectDefineProperty = Object.defineProperty;

/** @internal */
type ObjectDefinition = [/*items*/ unknown[], /*null prototype*/ boolean];

/** @internal */
type RecordShrinkContext = {
  items: Value<unknown>[];
  proto: Value<boolean>;
};

/** @internal */
function isRecordShrinkContext(context: unknown): context is RecordShrinkContext {
  return typeof context === 'object' && context !== null && 'items' in context && 'proto' in context;
}

/**
 * Arbitrary responsible for building "record-like" objects: a fixed set of keys, each associated to a value
 * coming from its own arbitrary, plus a boolean telling whether the produced object has a null prototype.
 *
 * It is functionally equivalent to `tuple(tuple(...valueArbs), nullPrototypeArb).map(mapper, unmapper)` but it
 * builds the resulting object directly on `generate` instead of going through the intermediate nested tuples.
 * That removes a large amount of per-`generate` allocations (intermediate `Value` instances, value and context
 * arrays of the two tuples, the map wrapper, …) on what is one of the most used building blocks of fast-check.
 *
 * The rarely used paths — `canShrinkWithoutContext` and `shrink` on values that were not produced by our own
 * `generate` (eg: user-provided values) — are delegated to the equivalent tuple-based arbitrary (`fallback`)
 * so that their behaviour stays strictly identical to the historical implementation.
 *
 * @internal
 */
export class ValuesAndSeparateKeysArbitrary<TObj> extends Arbitrary<TObj> {
  constructor(
    private readonly valueArbs: Arbitrary<unknown>[],
    private readonly nullPrototypeArb: Arbitrary<boolean>,
    private readonly mapper: (definition: ObjectDefinition) => TObj,
    private readonly fallback: Arbitrary<TObj>,
  ) {
    super();
  }

  generate(mrng: Random, biasFactor: number | undefined): Value<TObj> {
    const arbs = this.valueArbs;
    const items: Value<unknown>[] = [];
    for (let idx = 0; idx !== arbs.length; ++idx) {
      safePush(items, arbs[idx].generate(mrng, biasFactor));
    }
    const proto = this.nullPrototypeArb.generate(mrng, biasFactor);
    return this.buildValue(items, proto);
  }

  canShrinkWithoutContext(value: unknown): value is TObj {
    return this.fallback.canShrinkWithoutContext(value);
  }

  shrink(value: TObj, context: unknown): Stream<Value<TObj>> {
    if (!isRecordShrinkContext(context)) {
      // No context produced by our own `generate` (eg: user-provided value): delegate to the
      // tuple-based arbitrary which knows how to recover a shrink from scratch.
      return this.fallback.shrink(value, context);
    }
    const items = context.items;
    const proto = context.proto;
    const arbs = this.valueArbs;
    const shrinks: IterableIterator<Value<TObj>>[] = [];
    // Shrink the values one by one (same strategy and ordering as the underlying tuples).
    for (let idx = 0; idx !== arbs.length; ++idx) {
      const index = idx;
      safePush(
        shrinks,
        makeLazy(() =>
          arbs[index].shrink(items[index].value_, items[index].context).map((shrunk) => {
            const nextItems = safeSlice(items, 0, items.length);
            nextItems[index] = shrunk;
            return this.buildValue(nextItems, proto);
          }),
        ),
      );
    }
    // Then shrink the null-prototype flag.
    safePush(
      shrinks,
      makeLazy(() =>
        this.nullPrototypeArb
          .shrink(proto.value_, proto.context)
          .map((shrunkProto) => this.buildValue(items, shrunkProto)),
      ),
    );
    return Stream.nil<Value<TObj>>().join(...shrinks);
  }

  /** @internal */
  private buildValue(items: Value<unknown>[], proto: Value<boolean>): Value<TObj> {
    const obj = this.buildObject(items, proto);
    const context: RecordShrinkContext = { items, proto };
    return new Value(obj, context);
  }

  /** @internal */
  private buildObject(items: Value<unknown>[], proto: Value<boolean>): TObj {
    let cloneable = false;
    const values: unknown[] = [];
    for (let idx = 0; idx !== items.length; ++idx) {
      const item = items[idx];
      cloneable = cloneable || item.hasToBeCloned;
      safePush(values, item.value);
    }
    const obj = this.mapper([values, proto.value]);
    if (cloneable && typeof obj === 'object' && obj !== null && !hasCloneMethod(obj)) {
      // At least one of the values has to be cloned whenever the resulting object is accessed more than once:
      // we attach a clone method rebuilding the object out of freshly cloned values, exactly like the historical
      // map-based implementation used to do.
      safeObjectDefineProperty(obj, cloneMethod, {
        value: () => this.buildObject(items, proto),
        configurable: true,
        enumerable: false,
        writable: true,
      });
    }
    return obj;
  }
}

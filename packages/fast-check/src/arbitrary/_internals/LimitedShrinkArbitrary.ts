import { Arbitrary } from '../../check/arbitrary/definition/Arbitrary';
import { Value } from '../../check/arbitrary/definition/Value';
import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';

/** @internal */
export class LimitedShrinkArbitrary<T> extends Arbitrary<T> {
  constructor(
    readonly arb: Arbitrary<T>,
    readonly maxShrinks: number,
  ) {
    super();
  }
  generate(mrng: Random, biasFactor: number | undefined): Value<T> {
    const value = this.arb.generate(mrng, biasFactor);
    return this.valueMapper(value, 0);
  }
  canShrinkWithoutContext(value: unknown): value is T {
    return this.arb.canShrinkWithoutContext(value);
  }
  shrink(value: T, context?: unknown): Stream<Value<T>> {
    if (this.isSafeContext(context)) {
      return this.safeShrink(value, context.originalContext, context.length);
    }
    return this.safeShrink(value, undefined, 0);
  }
  private safeShrink(value: T, originalContext: unknown, currentLength: number): Stream<Value<T>> {
    const remaining = this.maxShrinks - currentLength;
    if (remaining <= 0) {
      return Stream.nil(); // early-exit to avoid potentially expensive computations in .shrink
    }
    return new Stream(zip(this.arb.shrink(value, originalContext), iotaFrom(currentLength + 1)))
      .take(remaining)
      .map((valueAndLength) => this.valueMapper(valueAndLength[0], valueAndLength[1]));
  }
  private valueMapper(v: Value<T>, newLength: number): Value<T> {
    const context: LimitedShrinkArbitraryContext<T> = { originalContext: v.context, length: newLength };
    return new Value(v.value, context);
  }
  private isSafeContext(context: unknown): context is LimitedShrinkArbitraryContext<T> {
    return (
      context != null &&
      typeof context === 'object' &&
      'originalContext' in (context as any) &&
      'length' in (context as any)
    );
  }
}

/** @internal */
function* iotaFrom(startValue: number) {
  let value = startValue;
  while (true) {
    yield value;
    ++value;
  }
}

type ZippedIterableIteratorValues<ITs extends IterableIterator<unknown>[]> = {
  [K in keyof ITs]: ITs[K] extends IterableIterator<infer IT> ? IT : unknown;
};

type ZippedIterableIterator<ITs extends IterableIterator<unknown>[]> = IterableIterator<
  ZippedIterableIteratorValues<ITs>
>;

function initZippedValues<ITs extends IterableIterator<unknown>[]>(its: ITs) {
  const vs: IteratorResult<unknown, any>[] = [];
  for (let index = 0; index !== its.length; ++index) {
    vs.push(its[index].next());
  }
  return vs;
}

function nextZippedValues<ITs extends IterableIterator<unknown>[]>(its: ITs, vs: IteratorResult<unknown, any>[]) {
  for (let index = 0; index !== its.length; ++index) {
    vs[index] = its[index].next();
  }
}

function isDoneZippedValues(vs: IteratorResult<unknown, any>[]): boolean {
  for (let index = 0; index !== vs.length; ++index) {
    if (vs[index].done) {
      return true;
    }
  }
  return false;
}

/** @internal */
function* zip<ITs extends IterableIterator<unknown>[]>(...its: ITs): ZippedIterableIterator<ITs> {
  const vs = initZippedValues(its);
  while (!isDoneZippedValues(vs)) {
    yield vs.map((v) => v.value) as unknown as ZippedIterableIteratorValues<ITs>;
    nextZippedValues(its, vs);
  }
}

/** @internal */
type LimitedShrinkArbitraryContext<T> = {
  originalContext: unknown;
  length: number;
};

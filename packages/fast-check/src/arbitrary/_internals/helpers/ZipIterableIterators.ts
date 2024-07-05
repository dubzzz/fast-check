/** @internal */
function initZippedValues<ITs extends IterableIterator<unknown>[]>(its: ITs) {
  const vs: IteratorResult<unknown, any>[] = [];
  for (let index = 0; index !== its.length; ++index) {
    vs.push(its[index].next());
  }
  return vs;
}

/** @internal */
function nextZippedValues<ITs extends IterableIterator<unknown>[]>(its: ITs, vs: IteratorResult<unknown, any>[]) {
  for (let index = 0; index !== its.length; ++index) {
    vs[index] = its[index].next();
  }
}

/** @internal */
function isDoneZippedValues(vs: IteratorResult<unknown, any>[]): boolean {
  for (let index = 0; index !== vs.length; ++index) {
    if (vs[index].done) {
      return true;
    }
  }
  return false;
}
/** @internal */
export function* zipIterableIterators<ITs extends IterableIterator<unknown>[]>(
  ...its: ITs
): ZippedIterableIterator<ITs> {
  const vs = initZippedValues(its);
  while (!isDoneZippedValues(vs)) {
    yield vs.map((v) => v.value) as unknown as ZippedIterableIteratorValues<ITs>;
    nextZippedValues(its, vs);
  }
}

/** @internal */
type ZippedIterableIteratorValues<ITs extends IterableIterator<unknown>[]> = {
  [K in keyof ITs]: ITs[K] extends IterableIterator<infer IT> ? IT : unknown;
};

/** @internal */
type ZippedIterableIterator<ITs extends IterableIterator<unknown>[]> = IterableIterator<
  ZippedIterableIteratorValues<ITs>
>;

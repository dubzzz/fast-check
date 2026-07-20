class Nil<T> implements IterableIterator<T> {
  [Symbol.iterator](): IterableIterator<T> {
    return this;
  }
  next(value?: any): IteratorResult<T> {
    return { value, done: true };
  }
}

/** @internal */
export const nil: IteratorObject<any> = Iterator.from(new Nil<any>());

export function getNthOrLast<T>(it: IterableIterator<T>, nth: number): T | null {
  let remaining = nth;
  let last: T | null = null;
  for (const v of it) {
    if (remaining-- === 0) return v;
    last = v;
  }
  return last;
}

export function* joinAll<T, U, V>(its: IteratorObject<T, U, V>[]): IteratorObject<T, U, V> {
  for (const s of its) {
    for (let cur = s.next(); !cur.done; cur = s.next()) {
      yield cur.value;
    }
  }
  // oxlint-disable-next-line typescript/no-non-null-assertion
  return undefined! as U;
}

// The functions in this file have been extracted from Stream.ts
// for performance reasons
//
// They were originally defined as anonymous functions
// Most of the methods of Stream were calling Stream.prototype.flatMap (eg.: map, filter...)

class Nil<T> implements IterableIterator<T> {
  [Symbol.iterator](): IterableIterator<T> {
    return this;
  }
  next(value?: any): IteratorResult<T> {
    return { value, done: true };
  }
}

/** @internal */
export const nil: IterableIterator<any> = new Nil<any>();

/** @internal */
export function* joinHelper<T>(g: IterableIterator<T>, others: IterableIterator<T>[]): IterableIterator<T> {
  for (let cur = g.next(); !cur.done; cur = g.next()) {
    yield cur.value;
  }
  for (const s of others) {
    for (let cur = s.next(); !cur.done; cur = s.next()) {
      yield cur.value;
    }
  }
}

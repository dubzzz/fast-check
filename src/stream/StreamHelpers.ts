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
  static nil = new Nil<any>();
}

/** @internal */
export function nilHelper<T>(): IterableIterator<T> {
  return Nil.nil;
}

/** @internal */
export function* mapHelper<T, U>(g: IterableIterator<T>, f: (v: T) => U): IterableIterator<U> {
  for (const v of g) {
    yield f(v);
  }
}

/** @internal */
export function* flatMapHelper<T, U>(g: IterableIterator<T>, f: (v: T) => IterableIterator<U>): IterableIterator<U> {
  for (const v of g) {
    yield* f(v);
  }
}

/** @internal */
export function* filterHelper<T>(g: IterableIterator<T>, f: (v: T) => boolean): IterableIterator<T> {
  for (const v of g) {
    if (f(v)) {
      yield v;
    }
  }
}

/** @internal */
export function* takeWhileHelper<T>(g: IterableIterator<T>, f: (v: T) => boolean): IterableIterator<T> {
  let cur = g.next();
  while (!cur.done && f(cur.value)) {
    yield cur.value;
    cur = g.next();
  }
}

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

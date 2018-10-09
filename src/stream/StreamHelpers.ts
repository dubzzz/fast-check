// The functions in this file have been extracted from Stream.ts
// for performance reasons
//
// They were originally defined as anonymous functions
// Most of the methods of Stream were calling Stream.prototype.flatMap (eg.: map, filter...)

/** @hidden */
export function* nilHelper<T>(): IterableIterator<T> {
  // nil has no value
}

/** @hidden */
export function* mapHelper<T, U>(g: IterableIterator<T>, f: (v: T) => U): IterableIterator<U> {
  for (const v of g) {
    yield f(v);
  }
}

/** @hidden */
export function* flatMapHelper<T, U>(g: IterableIterator<T>, f: (v: T) => IterableIterator<U>): IterableIterator<U> {
  for (const v of g) {
    yield* f(v);
  }
}

/** @hidden */
export function* filterHelper<T>(g: IterableIterator<T>, f: (v: T) => boolean): IterableIterator<T> {
  for (const v of g) {
    if (f(v)) {
      yield v;
    }
  }
}

/** @hidden */
export function* takeWhileHelper<T>(g: IterableIterator<T>, f: (v: T) => boolean): IterableIterator<T> {
  let cur = g.next();
  while (!cur.done && f(cur.value)) {
    yield cur.value;
    cur = g.next();
  }
}

/** @hidden */
export function* joinHelper<T>(g: IterableIterator<T>, others: IterableIterator<T>[]): IterableIterator<T> {
  yield* g;
  for (const s of others) {
    yield* s;
  }
}

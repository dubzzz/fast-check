export default class Stream<T> implements IterableIterator<T> {
  static nil<T>() {
    function* g(): IterableIterator<T> {
      // nil has no value
    }
    return new Stream<T>(g());
  }

  constructor(private readonly g: IterableIterator<T>) {}

  next(): IteratorResult<T> {
    return this.g.next();
  }
  [Symbol.iterator](): IterableIterator<T> {
    return this.g;
  }

  map<U>(f: (v: T) => U): Stream<U> {
    function* helper(v: T): IterableIterator<U> {
      yield f(v);
    }
    return this.flatMap(helper);
  }
  flatMap<U>(f: (v: T) => IterableIterator<U>): Stream<U> {
    function* helper(g: IterableIterator<T>): IterableIterator<U> {
      for (const v of g) {
        yield* f(v);
      }
    }
    return new Stream(helper(this.g));
  }

  dropWhile(f: (v: T) => boolean): Stream<T> {
    let foundEligible: boolean = false;
    function* helper(v: T): IterableIterator<T> {
      if (foundEligible || !f(v)) {
        foundEligible = true;
        yield v;
      }
    }
    return this.flatMap(helper);
  }
  drop(n: number): Stream<T> {
    let idx = 0;
    function helper(v: T): boolean {
      return idx++ < n;
    }
    return this.dropWhile(helper);
  }
  takeWhile(f: (v: T) => boolean): Stream<T> {
    function* helper(g: IterableIterator<T>): IterableIterator<T> {
      let cur = g.next();
      while (!cur.done && f(cur.value)) {
        yield cur.value;
        cur = g.next();
      }
    }
    return new Stream<T>(helper(this.g));
  }
  take(n: number): Stream<T> {
    let idx = 0;
    function helper(v: T): boolean {
      return idx++ < n;
    }
    return this.takeWhile(helper);
  }

  filter(f: (v: T) => boolean): Stream<T> {
    function* helper(v: T) {
      if (f(v)) {
        yield v;
      }
    }
    return this.flatMap(helper);
  }

  every(f: (v: T) => boolean): boolean {
    for (const v of this.g) {
      if (!f(v)) {
        return false;
      }
    }
    return true;
  }
  has(f: (v: T) => boolean): [boolean, T | null] {
    for (const v of this.g) {
      if (f(v)) {
        return [true, v];
      }
    }
    return [false, null];
  }

  join(...others: IterableIterator<T>[]): Stream<T> {
    function* helper(c: Stream<T>): IterableIterator<T> {
      yield* c;
      for (const s of others) {
        yield* s;
      }
    }
    return new Stream<T>(helper(this));
  }

  getNthOrLast(nth: number): T | null {
    let remaining = nth;
    let last: T | null = null;
    for (const v of this.g) {
      if (remaining-- === 0) return v;
      last = v;
    }
    return last;
  }
}

function stream<T>(g: IterableIterator<T>): Stream<T> {
  return new Stream<T>(g);
}

export { stream, Stream };

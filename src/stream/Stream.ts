export default class Stream<T> implements IterableIterator<T> {
  /**
   * Create an empty stream of T
   */
  static nil<T>() {
    function* g(): IterableIterator<T> {
      // nil has no value
    }
    return new Stream<T>(g());
  }

  /**
   * Create a Stream based on `g`
   * @param g Underlying data of the Stream
   */
  constructor(private readonly g: IterableIterator<T>) {}

  next(): IteratorResult<T> {
    return this.g.next();
  }
  [Symbol.iterator](): IterableIterator<T> {
    return this.g;
  }

  /**
   * Map all elements of the Stream using `f`
   * 
   * WARNING: It closes the current stream
   * 
   * @param f Mapper function
   */
  map<U>(f: (v: T) => U): Stream<U> {
    function* helper(v: T): IterableIterator<U> {
      yield f(v);
    }
    return this.flatMap(helper);
  }
  /**
   * Flat map all elements of the Stream using `f`
   * 
   * WARNING: It closes the current stream
   * 
   * @param f Mapper function
   */
  flatMap<U>(f: (v: T) => IterableIterator<U>): Stream<U> {
    function* helper(g: IterableIterator<T>): IterableIterator<U> {
      for (const v of g) {
        yield* f(v);
      }
    }
    return new Stream(helper(this.g));
  }

  /**
   * Drop elements from the Stream while `f(element) === true`
   * 
   * WARNING: It closes the current stream
   * 
   * @param f Drop condition
   */
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
  /**
   * Drop `n` first elements of the Stream
   * 
   * WARNING: It closes the current stream
   * 
   * @param n Number of elements to drop
   */
  drop(n: number): Stream<T> {
    let idx = 0;
    function helper(v: T): boolean {
      return idx++ < n;
    }
    return this.dropWhile(helper);
  }
  /**
   * Take elements from the Stream while `f(element) === true`
   * 
   * WARNING: It closes the current stream
   * 
   * @param f Take condition
   */
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
  /**
   * Take `n` first elements of the Stream
   * 
   * WARNING: It closes the current stream
   * 
   * @param n Number of elements to take
   */
  take(n: number): Stream<T> {
    let idx = 0;
    function helper(v: T): boolean {
      return idx++ < n;
    }
    return this.takeWhile(helper);
  }

  /**
   * Filter elements of the Stream
   * 
   * WARNING: It closes the current stream
   * 
   * @param f Elements to keep
   */
  filter(f: (v: T) => boolean): Stream<T> {
    function* helper(v: T) {
      if (f(v)) {
        yield v;
      }
    }
    return this.flatMap(helper);
  }

  /**
   * Check whether all elements of the Stream are successful for `f`
   * 
   * WARNING: It closes the current stream
   * 
   * @param f Condition to check
   */
  every(f: (v: T) => boolean): boolean {
    for (const v of this.g) {
      if (!f(v)) {
        return false;
      }
    }
    return true;
  }
  /**
   * Check whether one of the elements of the Stream is successful for `f`
   * 
   * WARNING: It closes the current stream
   * 
   * @param f Condition to check
   */
  has(f: (v: T) => boolean): [boolean, T | null] {
    for (const v of this.g) {
      if (f(v)) {
        return [true, v];
      }
    }
    return [false, null];
  }

  /**
   * Join `others` Stream to the current Stream
   * 
   * WARNING: It closes the current stream and the other ones (as soon as it iterates over them)
   * 
   * @param others Streams to join to the current Stream
   */
  join(...others: IterableIterator<T>[]): Stream<T> {
    function* helper(c: Stream<T>): IterableIterator<T> {
      yield* c;
      for (const s of others) {
        yield* s;
      }
    }
    return new Stream<T>(helper(this));
  }

  /**
   * Take the `nth` element of the Stream of the last (if it does not exist)
   * 
   * WARNING: It closes the current stream
   * 
   * @param nth Position of the element to extract
   */
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

/**
 * Create a Stream based on `g`
 * @param g Underlying data of the Stream
 */
function stream<T>(g: IterableIterator<T>): Stream<T> {
  return new Stream<T>(g);
}

export { stream, Stream };

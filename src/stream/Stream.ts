import { filterHelper, flatMapHelper, joinHelper, mapHelper, nilHelper, takeWhileHelper } from './StreamHelpers';

/**
 * Wrapper around `IterableIterator` interface
 * offering a set of helpers to deal with iterations in a simple way
 *
 * @public
 */
export class Stream<T> implements IterableIterator<T> {
  /**
   * Create an empty stream of T
   */
  static nil<T>(): Stream<T> {
    return new Stream(nilHelper());
  }

  /**
   * Create a stream of T from a variable number of elements
   *
   * @param elements - Elements used to create the Stream
   */
  static of<T>(...elements: T[]): Stream<T> {
    return new Stream(elements[Symbol.iterator]());
  }

  // /*DEBUG*/ // no double iteration
  // /*DEBUG*/ private isLive: boolean;

  /**
   * Create a Stream based on `g`
   * @param g - Underlying data of the Stream
   */
  constructor(private readonly g: IterableIterator<T>) {
    // /*DEBUG*/ this.isLive = true;
  }

  // /*DEBUG*/ private closeCurrentStream() {
  // /*DEBUG*/   if (! this.isLive) throw new Error('Stream has already been closed');
  // /*DEBUG*/   this.isLive = false;
  // /*DEBUG*/ }

  next(): IteratorResult<T> {
    return this.g.next();
  }
  [Symbol.iterator](): IterableIterator<T> {
    // /*DEBUG*/ this.closeCurrentStream();
    return this.g;
  }

  /**
   * Map all elements of the Stream using `f`
   *
   * WARNING: It closes the current stream
   *
   * @param f - Mapper function
   */
  map<U>(f: (v: T) => U): Stream<U> {
    // /*DEBUG*/ this.closeCurrentStream();
    return new Stream(mapHelper(this.g, f));
  }
  /**
   * Flat map all elements of the Stream using `f`
   *
   * WARNING: It closes the current stream
   *
   * @param f - Mapper function
   */
  flatMap<U>(f: (v: T) => IterableIterator<U>): Stream<U> {
    // /*DEBUG*/ this.closeCurrentStream();
    return new Stream(flatMapHelper(this.g, f));
  }

  /**
   * Drop elements from the Stream while `f(element) === true`
   *
   * WARNING: It closes the current stream
   *
   * @param f - Drop condition
   */
  dropWhile(f: (v: T) => boolean): Stream<T> {
    let foundEligible = false;
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
   * @param n - Number of elements to drop
   */
  drop(n: number): Stream<T> {
    let idx = 0;
    function helper(): boolean {
      return idx++ < n;
    }
    return this.dropWhile(helper);
  }
  /**
   * Take elements from the Stream while `f(element) === true`
   *
   * WARNING: It closes the current stream
   *
   * @param f - Take condition
   */
  takeWhile(f: (v: T) => boolean): Stream<T> {
    // /*DEBUG*/ this.closeCurrentStream();
    return new Stream(takeWhileHelper(this.g, f));
  }
  /**
   * Take `n` first elements of the Stream
   *
   * WARNING: It closes the current stream
   *
   * @param n - Number of elements to take
   */
  take(n: number): Stream<T> {
    let idx = 0;
    function helper(): boolean {
      return idx++ < n;
    }
    return this.takeWhile(helper);
  }

  /**
   * Filter elements of the Stream
   *
   * WARNING: It closes the current stream
   *
   * @param f - Elements to keep
   */
  filter<U extends T>(f: (v: T) => v is U): Stream<U>;
  /**
   * Filter elements of the Stream
   *
   * WARNING: It closes the current stream
   *
   * @param f - Elements to keep
   */
  filter(f: (v: T) => boolean): Stream<T>;
  filter<U extends T>(f: (v: T) => v is U): Stream<U> {
    // /*DEBUG*/ this.closeCurrentStream();
    return new Stream(filterHelper(this.g, f));
  }

  /**
   * Check whether all elements of the Stream are successful for `f`
   *
   * WARNING: It closes the current stream
   *
   * @param f - Condition to check
   */
  every(f: (v: T) => boolean): boolean {
    // /*DEBUG*/ this.closeCurrentStream();
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
   * @param f - Condition to check
   */
  has(f: (v: T) => boolean): [boolean, T | null] {
    // /*DEBUG*/ this.closeCurrentStream();
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
   * @param others - Streams to join to the current Stream
   */
  join(...others: IterableIterator<T>[]): Stream<T> {
    // /*DEBUG*/ this.closeCurrentStream();
    return new Stream(joinHelper(this.g, others));
  }

  /**
   * Take the `nth` element of the Stream of the last (if it does not exist)
   *
   * WARNING: It closes the current stream
   *
   * @param nth - Position of the element to extract
   */
  getNthOrLast(nth: number): T | null {
    // /*DEBUG*/ this.closeCurrentStream();
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
 *
 * @param g - Underlying data of the Stream
 *
 * @public
 */
export function stream<T>(g: IterableIterator<T>): Stream<T> {
  return new Stream<T>(g);
}

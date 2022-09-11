import {
  filterHelper,
  flatMapHelper,
  joinHelper,
  mapHelper,
  nilHelper,
  takeNHelper,
  takeWhileHelper,
} from './StreamHelpers';

const safeSymbolIterator: typeof Symbol.iterator = Symbol.iterator;

/**
 * Wrapper around `IterableIterator` interface
 * offering a set of helpers to deal with iterations in a simple way
 *
 * @remarks Since 0.0.7
 * @public
 */
export class Stream<T> implements IterableIterator<T> {
  /**
   * Create an empty stream of T
   * @remarks Since 0.0.1
   */
  static nil<T>(): Stream<T> {
    return new Stream(nilHelper());
  }

  /**
   * Create a stream of T from a variable number of elements
   *
   * @param elements - Elements used to create the Stream
   * @remarks Since 2.12.0
   */
  static of<T>(...elements: T[]): Stream<T> {
    return new Stream(elements[safeSymbolIterator]());
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
  [safeSymbolIterator](): IterableIterator<T> {
    // /*DEBUG*/ this.closeCurrentStream();
    return this.g;
  }

  /**
   * Map all elements of the Stream using `f`
   *
   * WARNING: It closes the current stream
   *
   * @param f - Mapper function
   * @remarks Since 0.0.1
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
   * @remarks Since 0.0.1
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
   * @remarks Since 0.0.1
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
   * @remarks Since 0.0.1
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
   * @remarks Since 0.0.1
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
   * @remarks Since 0.0.1
   */
  take(n: number): Stream<T> {
    // /*DEBUG*/ this.closeCurrentStream();
    return new Stream(takeNHelper(this.g, n));
  }

  /**
   * Filter elements of the Stream
   *
   * WARNING: It closes the current stream
   *
   * @param f - Elements to keep
   * @remarks Since 1.23.0
   */
  filter<U extends T>(f: (v: T) => v is U): Stream<U>;
  /**
   * Filter elements of the Stream
   *
   * WARNING: It closes the current stream
   *
   * @param f - Elements to keep
   * @remarks Since 0.0.1
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
   * @remarks Since 0.0.1
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
   * @remarks Since 0.0.1
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
   * @remarks Since 0.0.1
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
   * @remarks Since 0.0.12
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
 * @remarks Since 0.0.7
 * @public
 */
export function stream<T>(g: IterableIterator<T>): Stream<T> {
  return new Stream<T>(g);
}

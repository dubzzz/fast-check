import { joinHelper, nil } from './StreamHelpers.js';

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
    return new Stream(nil);
  }

  /**
   * Create a stream of T from a variable number of elements
   *
   * @param elements - Elements used to create the Stream
   * @remarks Since 2.12.0
   */
  static of<T>(...elements: T[]): Stream<T> {
    return new Stream(elements[Symbol.iterator]());
  }

  /**
   * Create a Stream based on `g`
   * @param g - Underlying data of the Stream
   */
  constructor(/** @internal */ private readonly g: IterableIterator<T>) {}

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
   * @param f - Mapper function
   * @remarks Since 0.0.1
   */
  map<U>(f: (v: T) => U): Stream<U> {
    return new Stream(this.g.map(f));
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
    return new Stream(this.g.flatMap(f));
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
    return new Stream(this.g.drop(n));
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
    return new Stream(this.g.take(n));
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
    return new Stream(this.g.filter(f));
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
    return this.g.every(f);
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
    const m = [...this.g.filter(f).take(1)];
    return m.length !== 0 ? [true, m[0]] : [false, null];
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

/**
 * @internal
 * @hidden
 */
class LazyIterableIterator<T> implements IterableIterator<T> {
  private it?: IterableIterator<T>;
  constructor(private readonly producer: () => IterableIterator<T>) {}

  [Symbol.iterator]() {
    if (this.it === undefined) {
      this.it = this.producer();
    }
    return this.it;
  }
  next() {
    if (this.it === undefined) {
      this.it = this.producer();
    }
    return this.it.next();
  }
}

/**
 * @internal
 * @hidden
 * Create an IterableIterator based on a function that will only be called once if needed
 * @param producer Function to instanciate the underlying IterableIterator
 */
export function makeLazy<T>(producer: () => IterableIterator<T>): IterableIterator<T> {
  return new LazyIterableIterator(producer);
}

/** @internal */
class LazyIterator<T> extends Iterator<T> {
  private it?: IteratorObject<T>;
  constructor(private readonly producer: () => IteratorObject<T>) {
    super();
  }

  next(...[value]: [] | [any]): IteratorResult<T, any> {
    if (this.it === undefined) {
      this.it = this.producer();
    }
    return this.it.next(value);
  }
}

/**
 * Create an IterableIterator based on a function that will only be called once if needed
 *
 * @param producer - Function to instanciate the underlying IterableIterator
 *
 * @internal
 */
export function makeLazy<T>(producer: () => IteratorObject<T>): IteratorObject<T> {
  return new LazyIterator(producer);
}

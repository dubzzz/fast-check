class Nil<T> implements IterableIterator<T> {
  [Symbol.iterator](): IterableIterator<T> {
    return this;
  }
  next(value?: any): IteratorResult<T> {
    return { value, done: true };
  }
}

export const nil: IteratorObject<any> = Iterator.from(new Nil<any>());

export function getNthOrLast<T>(it: IterableIterator<T>, nth: number): T | null {
  let remaining = nth;
  let last: T | null = null;
  for (const v of it) {
    if (remaining-- === 0) return v;
    last = v;
  }
  return last;
}

export function* joinAll<T, U, V>(its: IteratorObject<T, U, V>[]): IteratorObject<T, U, V> {
  let last!: U;
  for (const s of its) {
    let cur = s.next();
    for (; !cur.done; cur = s.next()) {
      yield cur.value;
    }
    last = cur.value;
  }
  return last;
}

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

export function makeLazy<T>(producer: () => IteratorObject<T>): IteratorObject<T> {
  return new LazyIterator(producer);
}

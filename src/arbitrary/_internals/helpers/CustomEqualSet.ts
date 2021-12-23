import { CustomSet, CustomSetBuilder } from '../interfaces/CustomSet';

/** @internal */
class CustomEqualSet<T> implements CustomSet<T> {
  private readonly storage: T[];

  constructor(private readonly isEqual: (v1: T, v2: T) => boolean) {
    this.storage = [];
  }

  tryAdd(value: T): boolean {
    for (let idx = 0; idx !== this.storage.length; ++idx) {
      if (this.isEqual(this.storage[idx], value)) {
        return false;
      }
    }
    this.storage.push(value);
    return true;
  }

  size(): number {
    return this.storage.length;
  }

  toArray(): T[] {
    return this.storage.slice();
  }
}

/**
 * Builder for CustomSet based on a fully custom equlity function
 *
 * @internal
 */
export class CustomEqualSetBuilder<T> implements CustomSetBuilder<T> {
  constructor(private readonly isEqual: (v1: T, v2: T) => boolean) {}

  nil(): CustomSet<T> {
    return new CustomEqualSet(this.isEqual);
  }

  from(iterable: Iterable<T>): CustomSet<T> {
    const s = new CustomEqualSet(this.isEqual);
    for (const item of iterable) {
      s.tryAdd(item);
    }
    return s;
  }
}

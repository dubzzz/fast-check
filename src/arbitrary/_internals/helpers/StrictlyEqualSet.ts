import { CustomSet } from '../interfaces/CustomSet';

/**
 * CustomSet based on "strict equality" as defined by:
 * https://tc39.es/ecma262/multipage/abstract-operations.html#sec-isstrictlyequal
 *
 * And coming with the ability to select a sub-value from the received one.
 * @internal
 */
export class StrictlyEqualSet<T, U> implements CustomSet<T> {
  // Warning: Set uses SameValueZero equality
  // SameValueZero means:
  // - NaN equals NaN   => unexpected for ===
  // - 0   equals -0    => OK
  private readonly selectedItemsExceptNaN: Set<U>;
  private readonly data: T[];

  constructor(private readonly selector: (value: T) => U) {
    this.selectedItemsExceptNaN = new Set();
    this.data = [];
  }

  tryAdd(value: T): boolean {
    const selected = this.selector(value);
    if (Number.isNaN(selected)) {
      this.data.push(value);
      return true;
    }
    const sizeBefore = this.selectedItemsExceptNaN.size;
    this.selectedItemsExceptNaN.add(selected);
    if (sizeBefore !== this.selectedItemsExceptNaN.size) {
      this.data.push(value);
      return true;
    }
    return false;
  }

  size(): number {
    return this.data.length;
  }

  getData(): T[] {
    return this.data;
  }
}

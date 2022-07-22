import { CustomSet } from '../interfaces/CustomSet';

const safeIs = Object.is.bind(Object);

/**
 * CustomSet based on "SameValue" as defined by:
 * https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevalue
 *
 * And coming with the ability to select a sub-value from the received one.
 * @internal
 */
export class SameValueSet<T, U> implements CustomSet<T> {
  // In JavaScript, Set uses "SameValueZero" to compare two items
  // thus a specific treatment would have to be done to properly distinguish -0 from +0
  private readonly selectedItemsExceptMinusZero: Set<U>;
  private readonly data: T[];
  private hasMinusZero: boolean;

  constructor(private readonly selector: (value: T) => U) {
    this.selectedItemsExceptMinusZero = new Set();
    this.data = [];
    this.hasMinusZero = false;
  }

  tryAdd(value: T): boolean {
    const selected = this.selector(value);
    if (safeIs(selected, -0)) {
      if (this.hasMinusZero) {
        return false;
      }
      this.data.push(value);
      this.hasMinusZero = true;
      return true;
    }
    const sizeBefore = this.selectedItemsExceptMinusZero.size;
    this.selectedItemsExceptMinusZero.add(selected);
    if (sizeBefore !== this.selectedItemsExceptMinusZero.size) {
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

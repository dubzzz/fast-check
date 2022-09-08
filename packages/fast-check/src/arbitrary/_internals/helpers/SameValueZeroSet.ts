import { safeAdd, safePush } from '../../../utils/globals';
import { CustomSet } from '../interfaces/CustomSet';

const SSet = Set;

/**
 * CustomSet based on "SameValueZero" as defined by:
 * https://tc39.es/ecma262/multipage/abstract-operations.html#sec-samevaluezero
 *
 * And coming with the ability to select a sub-value from the received one.
 * @internal
 */
export class SameValueZeroSet<T, U> implements CustomSet<T> {
  // In JavaScript, Set uses "SameValueZero" to compare two items
  private readonly selectedItems: Set<U>;
  private readonly data: T[];

  constructor(private readonly selector: (value: T) => U) {
    this.selectedItems = new SSet();
    this.data = [];
  }

  tryAdd(value: T): boolean {
    const selected = this.selector(value);
    const sizeBefore = this.selectedItems.size;
    safeAdd(this.selectedItems, selected);
    if (sizeBefore !== this.selectedItems.size) {
      safePush(this.data, value);
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

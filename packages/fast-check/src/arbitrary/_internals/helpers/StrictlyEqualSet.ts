import { safeAdd, safePush } from '../../../utils/globals';
import { CustomSet } from '../interfaces/CustomSet';

const SSet = Set;
const safeNumberIsNaN = Number.isNaN;

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
    this.selectedItemsExceptNaN = new SSet();
    this.data = [];
  }

  tryAdd(value: T): boolean {
    const selected = this.selector(value);
    if (safeNumberIsNaN(selected)) {
      safePush(this.data, value);
      return true;
    }
    const sizeBefore = this.selectedItemsExceptNaN.size;
    safeAdd(this.selectedItemsExceptNaN, selected);
    if (sizeBefore !== this.selectedItemsExceptNaN.size) {
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

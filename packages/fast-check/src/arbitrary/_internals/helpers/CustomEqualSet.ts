import { safePush } from '../../../utils/globals.js';
import type { CustomSet } from '../interfaces/CustomSet.js';

/**
 * CustomSet based on a fully custom equality function
 *
 * @internal
 */
export class CustomEqualSet<T> implements CustomSet<T> {
  private readonly data: T[];

  constructor(private readonly isEqual: (v1: T, v2: T) => boolean) {
    this.data = [];
  }

  tryAdd(value: T): boolean {
    for (let idx = 0; idx !== this.data.length; ++idx) {
      if (this.isEqual(this.data[idx], value)) {
        return false;
      }
    }
    safePush(this.data, value);
    return true;
  }

  size(): number {
    return this.data.length;
  }

  getData(): T[] {
    return this.data;
  }
}

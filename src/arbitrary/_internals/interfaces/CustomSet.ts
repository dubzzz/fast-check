export interface CustomSet<T> {
  /**
   * Try to add the value, returns true if it did, false otherwise
   * @param value - The value to be added
   */
  tryAdd(value: T): boolean;
  /**
   * Return the current size of the Set
   */
  size(): number;
  /**
   * Copy the Set into an Array
   */
  toArray(): T[];
}

export interface CustomSetBuilder<T> {
  /**
   * Create an empty instance of CustomSet
   */
  nil(): CustomSet<T>;
  /**
   * Create an instance of CustomSet based on an iterable possibly containing duplicated values
   * @param iterable - The iterable to be copied
   */
  from(iterable: Iterable<T>): CustomSet<T>;
}

/**
 * The interface for CustomSet
 * @internal
 */
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
   * Returns the underlying array containing the data
   * In general avoid re-using the CustomSet once you accessed it:
   * the array could be a copy or the underlying itself depending on the implementation
   */
  getData(): T[];
}

/**
 * Create an empty instance of CustomSet
 * @internal
 */
export type CustomSetBuilder<T> = () => CustomSet<T>;

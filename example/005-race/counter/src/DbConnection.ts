export interface DbConnection {
  /**
   * Return the current value stored into the DB
   * @returns Current value
   */
  read(): Promise<number>;

  /**
   * Update the value stored into the DB.
   * If the user provided an oldValue, the value will only be updated if it corresponds to oldValue
   *
   * @returns true on successful update
   */
  write(newValue: number, oldValue?: number): Promise<boolean>;
}

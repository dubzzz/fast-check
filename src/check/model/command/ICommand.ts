export interface ICommand<Model extends object, Real, RunResult, CheckAsync extends boolean = false> {
  /**
   * Check if the model is in the right state to apply the command
   *
   * WARNING: does not change the model
   *
   * @param m Model, simplified or schematic representation of real system
   */
  check(m: Readonly<Model>): CheckAsync extends false ? boolean : Promise<boolean>;

  /**
   * Receive the non-updated model and the real or system under test.
   * Perform the checks post-execution - Throw in case of invalid state.
   * Update the model accordingly
   *
   * @param m Model, simplified or schematic representation of real system
   * @param r Sytem under test
   */
  run(m: Model, r: Real): RunResult;

  /**
   * Name of the command
   */
  toString(): string;
}

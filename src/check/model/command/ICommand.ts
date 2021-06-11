// Model has to be a non-primitive type that's why we force Model to extend object
//
// Why a 'non-primitive type'?
// run method is supposed to alter the model received as input: primitive instances cannot be updated in-place while object can.

/**
 * Interface that should be implemented in order to define a command
 * @remarks Since 1.5.0
 * @public
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export interface ICommand<Model extends object, Real, RunResult, CheckAsync extends boolean = false> {
  /**
   * Check if the model is in the right state to apply the command
   *
   * WARNING: does not change the model
   *
   * @param m - Model, simplified or schematic representation of real system
   *
   * @remarks Since 1.5.0
   */
  check(m: Readonly<Model>): CheckAsync extends false ? boolean : Promise<boolean>;

  /**
   * Receive the non-updated model and the real or system under test.
   * Perform the checks post-execution - Throw in case of invalid state.
   * Update the model accordingly
   *
   * @param m - Model, simplified or schematic representation of real system
   * @param r - Sytem under test
   *
   * @remarks Since 1.5.0
   */
  run(m: Model, r: Real): RunResult;

  /**
   * Name of the command
   * @remarks Since 1.5.0
   */
  toString(): string;
}

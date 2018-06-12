export interface Command<Model, Real> {
  // Check if the model is in the right state to apply the command
  // WARNING: does not change the model
  checkPreconditions(m: Model): void;

  // Apply the command on the model
  apply(m: Model): void;

  // Receive the non-updated model and the real or system under test
  // Performs the checks post-execution - Throw in case of invalid state
  run(m: Model, r: Real): void;
}

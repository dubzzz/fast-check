import { PreconditionFailure } from './PreconditionFailure';

/**
 * Add pre-condition checks inside a property execution
 * @param expectTruthy interrupt the whole test whenever this value is falsy
 */
export const interrupt = (expectTruthy: boolean): void => {
  if (!expectTruthy) {
    throw new PreconditionFailure(true);
  }
};

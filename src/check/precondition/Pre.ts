import { PreconditionFailure } from './PreconditionFailure';

/**
 * Add pre-condition checks inside a property execution
 * @param expectTruthy - cancel the run whenever this value is falsy
 * @public
 */
export const pre = (expectTruthy: boolean): void => {
  if (!expectTruthy) {
    throw new PreconditionFailure();
  }
};

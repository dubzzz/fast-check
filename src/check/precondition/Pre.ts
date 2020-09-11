import { PreconditionFailure } from './PreconditionFailure';

/**
 * Add pre-condition checks inside a property execution
 * @param expectTruthy - cancel the run whenever this value is falsy
 * @public
 */
export function pre(expectTruthy: boolean): asserts expectTruthy {
  if (!expectTruthy) {
    throw new PreconditionFailure();
  }
}

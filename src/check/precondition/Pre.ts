import { PreconditionFailure } from './PreconditionFailure';

/**
 * Add pre-condition checks inside a property execution
 * @param expectTruthy - cancel the run whenever this value is falsy
 * @remarks Since 1.3.0
 * @public
 */
export function pre(expectTruthy: boolean): void {
  if (!expectTruthy) {
    throw new PreconditionFailure();
  }
}

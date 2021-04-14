import { cloneMethod } from '../check/symbols';
import { Arbitrary } from '../check/arbitrary/definition/Arbitrary';
import { clonedConstant } from './clonedConstant';

/**
 * Execution context attached to one predicate run
 * @remarks Since 2.2.0
 * @public
 */
export interface ContextValue {
  /**
   * Log execution details during a test.
   * Very helpful when troubleshooting failures
   * @param data - Data to be logged into the current context
   * @remarks Since 1.8.0
   */
  log(data: string): void;
  /**
   * Number of logs already logged into current context
   * @remarks Since 1.8.0
   */
  size(): number;
}

/** @internal */
class ContextImplem implements ContextValue {
  private readonly receivedLogs: string[];
  constructor() {
    this.receivedLogs = [];
  }
  log(data: string): void {
    this.receivedLogs.push(data);
  }
  size(): number {
    return this.receivedLogs.length;
  }
  toString() {
    return JSON.stringify({ logs: this.receivedLogs });
  }
  [cloneMethod]() {
    return new ContextImplem();
  }
}

/**
 * Produce a {@link ContextValue} instance
 * @remarks Since 1.8.0
 * @public
 */
export function context(): Arbitrary<ContextValue> {
  return clonedConstant(new ContextImplem());
}

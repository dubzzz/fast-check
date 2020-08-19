import { cloneMethod } from '../symbols';
import { clonedConstant } from './ConstantArbitrary';
import { Arbitrary } from './definition/Arbitrary';

/**
 * Execution context attached to one predicate run
 * @public
 */
export interface ContextValue {
  /**
   * Log execution details during a test.
   * Very helpful when troubleshooting failures
   * @param data - Data to be logged into the current context
   */
  log(data: string): void;
  /**
   * Number of logs already logged into current context
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
 * Produce a {@link fast-check#ContextValue} instance
 * @public
 */
export const context = () => clonedConstant(new ContextImplem()) as Arbitrary<ContextValue>;

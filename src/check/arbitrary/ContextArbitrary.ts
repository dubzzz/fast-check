import { cloneMethod } from '../symbols';
import { constant } from './ConstantArbitrary';
import { Arbitrary } from './definition/Arbitrary';

/**
 * Interface for IContext instances
 */
export interface IContext {
  /**
   * Log execution details during a test.
   * Very helpful when troubleshooting failures
   * @param data Data to be logged into the current context
   */
  log(data: string): void;
  /**
   * Number of logs already logged into current context
   */
  size(): number;
}

/** @hidden */
class ContextImplem implements IContext {
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
 * Produce a {@link IContext} instance
 */
export const context = () => constant(new ContextImplem()) as Arbitrary<IContext>;

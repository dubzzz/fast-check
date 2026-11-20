import type { Value, PreconditionFailure, PropertyFailure } from 'fast-check';
import type { WorkerProperty, LegacyPropertyWithHooks } from '../SharedTypes.js';

/**
 * NoopWorkerProperty is a placeholder instance of property returned
 * when the property is created from a worker (ie not from the main thread).
 * In such case, the assert runner whould never call anything from it.
 */
export class NoopWorkerProperty<Ts> implements WorkerProperty<Ts> {
  isAsync(): true {
    return true;
  }
  beforeEach(): LegacyPropertyWithHooks<Ts> {
    throw new Error('Method not implemented.');
  }
  afterEach(): LegacyPropertyWithHooks<Ts> {
    throw new Error('Method not implemented.');
  }
  generate(): Value<Ts> {
    throw new Error('Method not implemented.');
  }
  shrink(): ReturnType<WorkerProperty<Ts>['shrink']> {
    throw new Error('Method not implemented.');
  }
  run(): Promise<PreconditionFailure | PropertyFailure | null> {
    throw new Error('Method not implemented.');
  }
  runBeforeEach(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  runAfterEach(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

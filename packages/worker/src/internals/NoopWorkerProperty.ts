import {
  type IAsyncPropertyWithHooks,
  type Value,
  type Stream,
  type PreconditionFailure,
  type PropertyFailure,
} from 'fast-check';
import { type WorkerProperty } from './SharedTypes.js';

/**
 * NoopWorkerProperty is a placeholder instance of property returned
 * when the property is created from a worker (ie not from the main thread).
 * In such case, the assert runner whould never call anything from it.
 */
export class NoopWorkerProperty<Ts> implements WorkerProperty<Ts> {
  beforeEach(): IAsyncPropertyWithHooks<Ts> {
    throw new Error('Method not implemented.');
  }
  afterEach(): IAsyncPropertyWithHooks<Ts> {
    throw new Error('Method not implemented.');
  }
  isAsync(): true {
    throw new Error('Method not implemented.');
  }
  generate(): Value<Ts> {
    throw new Error('Method not implemented.');
  }
  shrink(): Stream<Value<Ts>> {
    throw new Error('Method not implemented.');
  }
  run(): Promise<PreconditionFailure | PropertyFailure | null> {
    throw new Error('Method not implemented.');
  }
}

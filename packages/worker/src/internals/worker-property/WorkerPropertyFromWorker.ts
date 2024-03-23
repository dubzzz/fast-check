import type { IAsyncPropertyWithHooks } from 'fast-check';
import type { PropertyArbitraries } from '../SharedTypes.js';
import type { ValueState } from '../ValueFromState.js';
import type { Payload } from '../worker-pool/IWorkerPool.js';

import fc from 'fast-check';
import { generateValueFromState } from '../ValueFromState.js';

class WorkerPropertyFromWorkerError extends Error {
  constructor(...args: Parameters<typeof Error>) {
    super(...args);
  }
}

const WorkerPropertyFromWorkerCache = new WeakMap<unknown[], ValueState>();

/**
 * A WorkerProperty delegating generating the values to the Worker thread
 * instead of running it into the main thread
 */
export class WorkerPropertyFromWorker<Ts extends [unknown, ...unknown[]]> implements IAsyncPropertyWithHooks<Ts> {
  private readonly numArbitraries: number;
  private readonly internalProperty: IAsyncPropertyWithHooks<Ts>;
  private valueState: ValueState | undefined;

  constructor(arbitraries: PropertyArbitraries<Ts>, predicate: (...args: Ts) => Promise<boolean | void>) {
    this.numArbitraries = arbitraries.length;
    this.internalProperty = fc.asyncProperty<Ts>(...arbitraries, predicate);
  }

  isAsync(): true {
    return this.internalProperty.isAsync();
  }

  generate(mrng: fc.Random, runId?: number | undefined): fc.Value<Ts> {
    // Extracting and cloning the state of Random before altering it
    const rawRngState = mrng.getState();
    if (rawRngState === undefined) {
      throw new WorkerPropertyFromWorkerError('Cannot extract any state from the provided instance of Random');
    }
    const valueState = { rngState: rawRngState.slice(), runId };
    this.valueState = valueState;

    // The value will never be consummed by the main-thread except for reporting in case of error
    const internalProperty = this.internalProperty;
    let value: Ts | undefined = undefined;
    // eslint-disable-next-line no-inner-declarations
    function getValue(): Ts {
      if (value === undefined) {
        value = generateValueFromState(internalProperty, valueState);
      }
      return value;
    }
    const inputs = [...Array(this.numArbitraries)].map((_, index) => ({
        toString: () => fc.stringify(getValue()[index]),
      })) as unknown as Ts;
    WorkerPropertyFromWorkerCache.set(inputs, valueState);
    return new fc.Value(inputs, undefined);
  }

  shrink(_value: fc.Value<Ts>): fc.Stream<fc.Value<Ts>> {
    // No shrink on worker-based generations
    return fc.Stream.nil();
  }

  run(v: Ts, dontRunHook?: boolean | undefined): Promise<fc.PreconditionFailure | fc.PropertyFailure | null> {
    return this.internalProperty.run(v, dontRunHook);
  }

  beforeEach(hookFunction: fc.AsyncPropertyHookFunction): fc.IAsyncPropertyWithHooks<Ts> {
    return this.internalProperty.beforeEach(hookFunction);
  }

  afterEach(hookFunction: fc.AsyncPropertyHookFunction): fc.IAsyncPropertyWithHooks<Ts> {
    return this.internalProperty.afterEach(hookFunction);
  }

  runBeforeEach(): Promise<void> {
    if (this.internalProperty.runBeforeEach !== undefined) {
      return this.internalProperty.runBeforeEach();
    }
    return Promise.resolve();
  }

  runAfterEach(): Promise<void> {
    if (this.internalProperty.runAfterEach !== undefined) {
      return this.internalProperty.runAfterEach();
    }
    return Promise.resolve();
  }

  getPayload(inputs: Ts): Payload<Ts> {
    const valueState = WorkerPropertyFromWorkerCache.get(inputs);
    if (valueState === undefined) {
      throw new WorkerPropertyFromWorkerError('Cannot get a relevant payload to execute this run');
    }
    return { source: 'worker', ...valueState };
  }
}

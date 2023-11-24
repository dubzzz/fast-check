import type {
  AsyncPropertyHookFunction,
  IAsyncPropertyWithHooks,
  IRawProperty,
  PreconditionFailure,
  PropertyFailure,
  Random,
  Stream,
  Value,
} from 'fast-check';
import type { PropertyArbitraries } from '../SharedTypes.js';
import type { ValueState } from '../ValueFromState.js';
import type { Payload } from '../worker-pool/IWorkerPool.js';

import fc from 'fast-check';
import { generateValueFromState } from '../ValueFromState.js';

const WorkerPropertyFromWorkerCache = new WeakMap<object, ValueState>();

class WorkerPropertyFromWorkerError extends Error {
  constructor(...args: Parameters<typeof Error>) {
    super(...args);
  }
}

function lazyGenerateValueFromState<Ts>(property: IRawProperty<Ts>, state: ValueState): () => Ts {
  let value: Ts | undefined = undefined;
  return function getValue(): Ts {
    if (value === undefined) {
      value = generateValueFromState(property, state);
    }
    return value;
  };
}

function extractCacheKey(inputs: [unknown, ...unknown[]]): object {
  return inputs[0] as object;
}

function buildInputsAndRegister<Ts extends [unknown, ...unknown[]]>(
  property: IRawProperty<Ts>,
  valueState: ValueState,
  numArbitraries: number,
): Ts {
  const getValue = lazyGenerateValueFromState(property, valueState);
  const inputs: object[] = [...Array(numArbitraries)].map((_, index) => ({
    toString: () => fc.stringify(getValue()[index]),
  }));

  WorkerPropertyFromWorkerCache.set(extractCacheKey(inputs as [object, ...object[]]), valueState);

  // WARNING: The type for inputs variable is obviously not the one the caller expects!
  // But in the context of WorkerPropertyFromWorker, caller knows that the inputs returned by generate
  // should not be consummed as-is and that they will be re-created on worker's side.
  return inputs as Ts;
}

/**
 * A WorkerProperty delegating generating the values to the Worker thread
 * instead of running it into the main thread
 */
export class WorkerPropertyFromWorker<Ts extends [unknown, ...unknown[]]> implements IAsyncPropertyWithHooks<Ts> {
  private readonly numArbitraries: number;
  private readonly internalProperty: IAsyncPropertyWithHooks<Ts>;

  constructor(arbitraries: PropertyArbitraries<Ts>, predicate: (...args: Ts) => Promise<boolean | void>) {
    this.numArbitraries = arbitraries.length;
    this.internalProperty = fc.asyncProperty<Ts>(...arbitraries, predicate);
  }

  isAsync(): true {
    return this.internalProperty.isAsync();
  }

  generate(mrng: Random, runId?: number): Value<Ts> {
    // Extracting and cloning the state of Random before altering it
    const rawRngState = mrng.getState();
    if (rawRngState === undefined) {
      throw new WorkerPropertyFromWorkerError('Cannot extract any state from the provided instance of Random');
    }
    const valueState = { rngState: rawRngState.slice(), runId };
    const inputs = buildInputsAndRegister(this.internalProperty, valueState, this.numArbitraries);
    return new fc.Value(inputs, undefined);
  }

  shrink(_value: Value<Ts>): Stream<Value<Ts>> {
    // No shrink on worker-based generations
    return fc.Stream.nil();
  }

  run(v: Ts): Promise<PreconditionFailure | PropertyFailure | null> {
    return this.internalProperty.run(v);
  }

  beforeEach(hookFunction: AsyncPropertyHookFunction): IAsyncPropertyWithHooks<Ts> {
    return this.internalProperty.beforeEach(hookFunction);
  }

  afterEach(hookFunction: AsyncPropertyHookFunction): IAsyncPropertyWithHooks<Ts> {
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
    const valueState = WorkerPropertyFromWorkerCache.get(extractCacheKey(inputs));
    if (valueState === undefined) {
      throw new WorkerPropertyFromWorkerError('Cannot get a relevant payload to execute this run');
    }
    return { source: 'worker', ...valueState };
  }
}

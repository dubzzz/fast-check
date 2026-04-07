import type { Random } from '../../random/generator/Random.js';
import type { Stream } from '../../stream/Stream.js';
import type { Value } from '../arbitrary/definition/Value.js';
import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { IRawProperty } from './IRawProperty.js';

/** @internal */
export class AbortedProperty<Ts, IsAsync extends boolean> implements IRawProperty<Ts, IsAsync> {
  constructor(
    readonly property: IRawProperty<Ts, IsAsync>,
    readonly signal: AbortSignal,
  ) {}

  isAsync(): IsAsync {
    return this.property.isAsync();
  }

  generate(mrng: Random, runId?: number): Value<Ts> {
    return this.property.generate(mrng, runId);
  }

  shrink(value: Value<Ts>): Stream<Value<Ts>> {
    return this.property.shrink(value);
  }

  run(v: Ts): ReturnType<IRawProperty<Ts, IsAsync>['run']> {
    if (this.signal.aborted) {
      const preconditionFailure = new PreconditionFailure(true);
      if (this.isAsync()) {
        return Promise.resolve(preconditionFailure) as any;
      } else {
        return preconditionFailure as any;
      }
    }
    if (this.isAsync()) {
      const propRun = Promise.race([this.property.run(v), waitForAbort(this.signal)]);
      return propRun as any;
    }
    return this.property.run(v);
  }

  runBeforeEach(): ReturnType<IRawProperty<Ts, IsAsync>['runBeforeEach']> {
    return this.property.runBeforeEach();
  }

  runAfterEach(): ReturnType<IRawProperty<Ts, IsAsync>['runAfterEach']> {
    return this.property.runAfterEach();
  }
}

/** @internal */
function waitForAbort(signal: AbortSignal): Promise<PreconditionFailure> {
  return new Promise<PreconditionFailure>((resolve) => {
    signal.addEventListener('abort', () => resolve(new PreconditionFailure(true)), { once: true });
  });
}

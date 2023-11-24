import type { Random } from '../../random/generator/Random';
import type { Stream } from '../../stream/Stream';
import type { Value } from '../arbitrary/definition/Value';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import type { IRawProperty } from './IRawProperty';

/** @internal */
function interruptAfter(timeMs: number, setTimeoutSafe: typeof setTimeout, clearTimeoutSafe: typeof clearTimeout) {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const promise = new Promise<PreconditionFailure>((resolve) => {
    timeoutHandle = setTimeoutSafe(() => {
      const preconditionFailure = new PreconditionFailure(true);
      resolve(preconditionFailure);
    }, timeMs);
  });
  return {
    // `timeoutHandle` will always be initialised at this point: body of `new Promise` has already been executed
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    clear: () => clearTimeoutSafe(timeoutHandle!),
    promise,
  };
}

/** @internal */
export class SkipAfterProperty<Ts, IsAsync extends boolean> implements IRawProperty<Ts, IsAsync> {
  private skipAfterTime: number;

  constructor(
    readonly property: IRawProperty<Ts, IsAsync>,
    readonly getTime: () => number,
    timeLimit: number,
    readonly interruptExecution: boolean,
    readonly setTimeoutSafe: typeof setTimeout,
    readonly clearTimeoutSafe: typeof clearTimeout,
  ) {
    this.skipAfterTime = this.getTime() + timeLimit;
  }

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
    const remainingTime = this.skipAfterTime - this.getTime();
    if (remainingTime <= 0) {
      const preconditionFailure = new PreconditionFailure(this.interruptExecution);
      if (this.isAsync()) {
        return Promise.resolve(preconditionFailure) as any; // IsAsync => Promise<PreconditionFailure | string | null>
      } else {
        return preconditionFailure as any; // !IsAsync => PreconditionFailure | string | null
      }
    }
    if (this.interruptExecution && this.isAsync()) {
      const t = interruptAfter(remainingTime, this.setTimeoutSafe, this.clearTimeoutSafe);
      const propRun = Promise.race([this.property.run(v), t.promise]);
      propRun.then(t.clear, t.clear); // always clear timeout handle - catch should never occur
      return propRun as any; // IsAsync => Promise<PreconditionFailure | string | null>
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

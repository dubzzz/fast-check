import type { Random } from '../../random/generator/Random.js';
import type { Stream } from '../../stream/Stream.js';
import type { Value } from '../arbitrary/definition/Value.js';
import { PreconditionFailure } from '../precondition/PreconditionFailure.js';
import type { IRawProperty } from './IRawProperty.js';

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
export class SkipAfterProperty<Ts> implements IRawProperty<Ts> {
  private skipAfterTime: number;

  constructor(
    readonly property: IRawProperty<Ts>,
    readonly getTime: () => number,
    timeLimit: number,
    readonly interruptExecution: boolean,
    readonly setTimeoutSafe: typeof setTimeout,
    readonly clearTimeoutSafe: typeof clearTimeout,
  ) {
    this.skipAfterTime = this.getTime() + timeLimit;
  }

  generate(mrng: Random, runId?: number): Value<Ts> {
    return this.property.generate(mrng, runId);
  }

  shrink(value: Value<Ts>): Stream<Value<Ts>> {
    return this.property.shrink(value);
  }

  run(v: Ts): ReturnType<IRawProperty<Ts>['run']> {
    const remainingTime = this.skipAfterTime - this.getTime();
    if (remainingTime <= 0) {
      const preconditionFailure = new PreconditionFailure(this.interruptExecution);
      return Promise.resolve(preconditionFailure);
    }
    if (this.interruptExecution) {
      const t = interruptAfter(remainingTime, this.setTimeoutSafe, this.clearTimeoutSafe);
      const propRun = Promise.race([this.property.run(v), t.promise]);
      propRun.then(t.clear, t.clear); // always clear timeout handle - catch should never occur
      return propRun;
    }
    return this.property.run(v);
  }

  runBeforeEach(): ReturnType<IRawProperty<Ts>['runBeforeEach']> {
    return this.property.runBeforeEach();
  }

  runAfterEach(): ReturnType<IRawProperty<Ts>['runAfterEach']> {
    return this.property.runAfterEach();
  }
}

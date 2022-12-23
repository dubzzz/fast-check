import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Value } from '../arbitrary/definition/Value';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import { IRawProperty } from './IRawProperty';

/** @internal */
function interruptAfter(timeMs: number) {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const promise = new Promise<PreconditionFailure>((resolve) => {
    timeoutHandle = setTimeout(() => {
      const preconditionFailure = new PreconditionFailure(true);
      resolve(preconditionFailure);
    }, timeMs);
  });
  return {
    // `timeoutHandle` will always be initialised at this point: body of `new Promise` has already been executed
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    clear: () => clearTimeout(timeoutHandle!),
    promise,
  };
}

/** @internal */
export class SkipAfterProperty<Ts, IsAsync extends boolean> implements IRawProperty<Ts, IsAsync> {
  runBeforeEach?: () => (IsAsync extends true ? Promise<void> : never) | (IsAsync extends false ? void : never);
  runAfterEach?: () => (IsAsync extends true ? Promise<void> : never) | (IsAsync extends false ? void : never);
  private skipAfterTime: number;

  constructor(
    readonly property: IRawProperty<Ts, IsAsync>,
    readonly getTime: () => number,
    timeLimit: number,
    readonly interruptExecution: boolean
  ) {
    this.skipAfterTime = this.getTime() + timeLimit;
    if (this.property.runBeforeEach !== undefined && this.property.runAfterEach !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.runBeforeEach = () => this.property.runBeforeEach!();
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.runAfterEach = () => this.property.runAfterEach!();
    }
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

  run(v: Ts, dontRunHook: boolean): ReturnType<IRawProperty<Ts, IsAsync>['run']> {
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
      const t = interruptAfter(remainingTime);
      const propRun = Promise.race([this.property.run(v, dontRunHook), t.promise]);
      propRun.then(t.clear, t.clear); // always clear timeout handle - catch should never occur
      return propRun as any; // IsAsync => Promise<PreconditionFailure | string | null>
    }
    return this.property.run(v, dontRunHook);
  }
}

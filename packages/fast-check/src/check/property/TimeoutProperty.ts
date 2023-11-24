import type { Random } from '../../random/generator/Random';
import type { Stream } from '../../stream/Stream';
import { Error } from '../../utils/globals';
import type { Value } from '../arbitrary/definition/Value';
import type { PreconditionFailure } from '../precondition/PreconditionFailure';
import type { PropertyFailure, IRawProperty } from './IRawProperty';

/** @internal */
const timeoutAfter = (timeMs: number, setTimeoutSafe: typeof setTimeout, clearTimeoutSafe: typeof clearTimeout) => {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const promise = new Promise<PropertyFailure>((resolve) => {
    timeoutHandle = setTimeoutSafe(() => {
      resolve({
        error: new Error(`Property timeout: exceeded limit of ${timeMs} milliseconds`),
        errorMessage: `Property timeout: exceeded limit of ${timeMs} milliseconds`,
      });
    }, timeMs);
  });
  return {
    // `timeoutHandle` will always be initialised at this point: body of `new Promise` has already been executed
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    clear: () => clearTimeoutSafe(timeoutHandle!),
    promise,
  };
};

/** @internal */
export class TimeoutProperty<Ts> implements IRawProperty<Ts, true> {
  constructor(
    readonly property: IRawProperty<Ts>,
    readonly timeMs: number,
    readonly setTimeoutSafe: typeof setTimeout,
    readonly clearTimeoutSafe: typeof clearTimeout,
  ) {}

  isAsync(): true {
    return true;
  }

  generate(mrng: Random, runId?: number): Value<Ts> {
    return this.property.generate(mrng, runId);
  }

  shrink(value: Value<Ts>): Stream<Value<Ts>> {
    return this.property.shrink(value);
  }

  async run(v: Ts): Promise<PreconditionFailure | PropertyFailure | null> {
    const t = timeoutAfter(this.timeMs, this.setTimeoutSafe, this.clearTimeoutSafe);
    const propRun = Promise.race([this.property.run(v), t.promise]);
    propRun.then(t.clear, t.clear); // always clear timeout handle - catch should never occur
    return propRun;
  }

  runBeforeEach(): ReturnType<IRawProperty<Ts, true>['runBeforeEach']> {
    return Promise.resolve(this.property.runBeforeEach());
  }

  runAfterEach(): ReturnType<IRawProperty<Ts, true>['runAfterEach']> {
    return Promise.resolve(this.property.runAfterEach());
  }
}

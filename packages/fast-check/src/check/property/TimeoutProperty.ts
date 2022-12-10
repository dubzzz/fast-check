import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { Error } from '../../utils/globals';
import { Value } from '../arbitrary/definition/Value';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import { PropertyFailure, IRawProperty } from './IRawProperty';

/** @internal */
const timeoutAfter = (timeMs: number) => {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const promise = new Promise<PropertyFailure>((resolve) => {
    timeoutHandle = setTimeout(() => {
      resolve({
        error: new Error(`Property timeout: exceeded limit of ${timeMs} milliseconds`),
        errorMessage: `Property timeout: exceeded limit of ${timeMs} milliseconds`,
      });
    }, timeMs);
  });
  return {
    // `timeoutHandle` will always be initialised at this point: body of `new Promise` has already been executed
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    clear: () => clearTimeout(timeoutHandle!),
    promise,
  };
};

/** @internal */
export class TimeoutProperty<Ts> implements IRawProperty<Ts, true> {
  runBeforeEach?: () => Promise<void>;
  runAfterEach?: () => Promise<void>;

  constructor(readonly property: IRawProperty<Ts>, readonly timeMs: number) {
    if (this.property.runBeforeEach !== undefined && this.property.runAfterEach !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.runBeforeEach = () => Promise.resolve(this.property.runBeforeEach!());
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.runAfterEach = () => Promise.resolve(this.property.runAfterEach!());
    }
  }

  isAsync(): true {
    return true;
  }

  generate(mrng: Random, runId?: number): Value<Ts> {
    return this.property.generate(mrng, runId);
  }

  shrink(value: Value<Ts>): Stream<Value<Ts>> {
    return this.property.shrink(value);
  }

  async run(v: Ts, dontRunHook: boolean): Promise<PreconditionFailure | PropertyFailure | null> {
    const t = timeoutAfter(this.timeMs);
    const propRun = Promise.race([this.property.run(v, dontRunHook), t.promise]);
    propRun.then(t.clear, t.clear); // always clear timeout handle - catch should never occur
    return propRun;
  }
}

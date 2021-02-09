import { Random } from '../../random/generator/Random';
import { Shrinkable } from '../arbitrary/definition/Shrinkable';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import { IRawProperty } from './IRawProperty';

/** @internal */
const timeoutAfter = (timeMs: number) => {
  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const promise = new Promise<string>((resolve) => {
    timeoutHandle = setTimeout(() => {
      resolve(`Property timeout: exceeded limit of ${timeMs} milliseconds`);
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
  constructor(readonly property: IRawProperty<Ts>, readonly timeMs: number) {}
  isAsync = () => true as const;
  generate(mrng: Random, runId?: number): Shrinkable<Ts> {
    return this.property.generate(mrng, runId);
  }
  async run(v: Ts): Promise<string | PreconditionFailure | null> {
    const t = timeoutAfter(this.timeMs);
    const propRun = Promise.race([this.property.run(v), t.promise]);
    propRun.then(t.clear, t.clear); // always clear timeout handle - catch should never occur
    return propRun;
  }
}

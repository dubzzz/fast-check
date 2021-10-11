import { Random } from '../../random/generator/Random';
import { Stream } from '../../stream/Stream';
import { NextValue } from '../arbitrary/definition/NextValue';
import { PreconditionFailure } from '../precondition/PreconditionFailure';
import { INextRawProperty } from './INextRawProperty';

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
export class TimeoutProperty<Ts> implements INextRawProperty<Ts, true> {
  constructor(readonly property: INextRawProperty<Ts>, readonly timeMs: number) {}

  isAsync(): true {
    return true;
  }

  generate(mrng: Random, runId?: number): NextValue<Ts> {
    return this.property.generate(mrng, runId);
  }

  shrink(value: NextValue<Ts>): Stream<NextValue<Ts>> {
    return this.property.shrink(value);
  }

  async run(v: Ts): Promise<string | PreconditionFailure | null> {
    const t = timeoutAfter(this.timeMs);
    const propRun = Promise.race([this.property.run(v), t.promise]);
    propRun.then(t.clear, t.clear); // always clear timeout handle - catch should never occur
    return propRun;
  }
}

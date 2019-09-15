import { Random } from '../../random/generator/Random';
import { Shrinkable } from '../arbitrary/definition/Shrinkable';
import { IProperty } from './IProperty';

/** @hidden */
const timeoutAfter = (timeMs: number) => {
  let timeoutHandle: (ReturnType<typeof setTimeout>) | null = null;
  const promise = new Promise<string>((resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      resolve(`Property timeout: exceeded limit of ${timeMs} milliseconds`);
    }, timeMs);
  });
  return { clear: () => clearTimeout(timeoutHandle!), promise };
};

/** @hidden */
export class TimeoutProperty<Ts> implements IProperty<Ts> {
  constructor(readonly property: IProperty<Ts>, readonly timeMs: number) {}
  isAsync = () => true;
  generate(mrng: Random, runId?: number): Shrinkable<Ts> {
    return this.property.generate(mrng, runId);
  }
  async run(v: Ts) {
    const t = timeoutAfter(this.timeMs);
    const propRun = Promise.race([this.property.run(v), t.promise]);
    propRun.then(t.clear, t.clear); // always clear timeout handle (equivalent to finally)
    return propRun;
  }
}

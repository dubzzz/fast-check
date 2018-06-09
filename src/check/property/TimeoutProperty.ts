import Random from '../../random/generator/Random';
import Shrinkable from '../arbitrary/definition/Shrinkable';
import IProperty from './IProperty';

/** @hidden */
const timeoutAfter = async (timeMs: number) =>
  new Promise<string>((resolve, reject) =>
    setTimeout(() => {
      resolve(`Property timeout: exceeded limit of ${timeMs} milliseconds`);
    }, timeMs)
  );

/** @hidden */
export class TimeoutProperty<Ts> implements IProperty<Ts> {
  constructor(readonly property: IProperty<Ts>, readonly timeMs: number) {}
  isAsync = () => true;
  generate(mrng: Random, runId?: number): Shrinkable<Ts> {
    return this.property.generate(mrng, runId);
  }
  async run(v: Ts) {
    return Promise.race([this.property.run(v), timeoutAfter(this.timeMs)]);
  }
}

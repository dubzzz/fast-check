import Random from '../../random/generator/Random';
import Arbitrary from '../arbitrary/definition/Arbitrary';
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
  generate(mrng: Random): Shrinkable<Ts> {
    return this.property.generate(mrng);
  }
  async run(v: Ts): Promise<string | null> {
    return Promise.race([this.property.run(v), timeoutAfter(this.timeMs)]);
  }
}

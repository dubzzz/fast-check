import Random from '../../random/generator/Random';
import Stream from '../../stream/Stream';
import Shrinkable from '../arbitrary/definition/Shrinkable';

export default interface IProperty<Ts> {
  isAsync(): boolean;
  generate(mrng: Random): Shrinkable<Ts>;
  run(v: Ts): Promise<string | null> | (string | null);
}

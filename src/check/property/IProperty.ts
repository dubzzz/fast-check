import Shrinkable from '../arbitrary/definition/Shrinkable';
import Random from '../../random/generator/Random';
import Stream from '../../stream/Stream';

export default interface IProperty<Ts> {
  isAsync(): boolean;
  generate(mrng: Random): Shrinkable<Ts>;
  run(v: Ts): Promise<string | null> | (string | null);
};

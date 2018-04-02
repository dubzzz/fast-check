import Random from '../../random/generator/Random';
import Arbitrary from '../arbitrary/definition/Arbitrary';
import Shrinkable from '../arbitrary/definition/Shrinkable';
import { tuple } from '../arbitrary/TupleArbitrary';
import IProperty from './IProperty';

export class Property<Ts> implements IProperty<Ts> {
  constructor(readonly arb: Arbitrary<Ts>, readonly predicate: (t: Ts) => boolean | void) {}
  isAsync = () => false;
  generate(mrng: Random): Shrinkable<Ts> {
    return this.arb.generate(mrng);
  }
  run(v: Ts): string | null {
    try {
      const output = this.predicate(v);
      return output == null || output === true ? null : 'Property failed by returning false';
    } catch (err) {
      if (err instanceof Error && err.stack) return `${err}\n\nStack trace: ${err.stack}`;
      return `${err}`;
    }
  }
}

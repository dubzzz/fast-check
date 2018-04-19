import Random from '../../../random/generator/Random';
import Stream from '../../../stream/Stream';
import Shrinkable from './Shrinkable';

export default abstract class Arbitrary<T> {
  abstract generate(mrng: Random): Shrinkable<T>;
  filter(predicate: (t: T) => boolean): Arbitrary<T> {
    const arb = this;
    return new class extends Arbitrary<T> {
      generate(mrng: Random): Shrinkable<T> {
        let g = arb.generate(mrng);
        while (!predicate(g.value)) {
          g = arb.generate(mrng);
        }
        return g.filter(predicate);
      }
    }();
  }
  map<U>(mapper: (t: T) => U): Arbitrary<U> {
    const arb = this;
    return new class extends Arbitrary<U> {
      generate(mrng: Random): Shrinkable<U> {
        return arb.generate(mrng).map(mapper);
      }
    }();
  }
  noShrink(): Arbitrary<T> {
    const arb = this;
    return new class extends Arbitrary<T> {
      generate(mrng: Random): Shrinkable<T> {
        return new Shrinkable(arb.generate(mrng).value);
      }
    }();
  }
}

export { Arbitrary };

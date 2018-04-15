import Random from '../../../random/generator/Random';
import Stream from '../../../stream/Stream';
import Shrinkable from './Shrinkable';

export default abstract class Arbitrary<T> {
  abstract generate(mrng: Random): Shrinkable<T>;
  filter(predicate: (t: T) => boolean): Arbitrary<T> {
    // tslint:disable-next-line:no-this-assignment
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
    // tslint:disable-next-line:no-this-assignment
    const arb = this;
    return new class extends Arbitrary<U> {
      generate(mrng: Random): Shrinkable<U> {
        return arb.generate(mrng).map(mapper);
      }
    }();
  }
  noShrink(): Arbitrary<T> {
    // tslint:disable-next-line:no-this-assignment
    const arb = this;
    return new class extends Arbitrary<T> {
      generate(mrng: Random): Shrinkable<T> {
        return new Shrinkable(arb.generate(mrng).value);
      }
    }();
  }
}

abstract class ArbitraryWithShrink<T> extends Arbitrary<T> {
  abstract generate(mrng: Random): Shrinkable<T>;
  abstract shrink(value: T, shrunkOnce?: boolean): Stream<T>;
  shrinkableFor(value: T, shrunkOnce?: boolean): Shrinkable<T> {
    return new Shrinkable(value, () =>
      this.shrink(value, shrunkOnce === true).map(v => this.shrinkableFor(v, shrunkOnce === true))
    );
  }
}

export { Arbitrary, ArbitraryWithShrink };

import Random from '../../../random/generator/Random';
import Stream from '../../../stream/Stream';
import Arbitrary from './Arbitrary';
import Shrinkable from './Shrinkable';

abstract class ArbitraryWithShrink<T> extends Arbitrary<T> {
  abstract generate(mrng: Random): Shrinkable<T>;
  abstract shrink(value: T, shrunkOnce?: boolean): Stream<T>;
  shrinkableFor(value: T, shrunkOnce?: boolean): Shrinkable<T> {
    return new Shrinkable(value, () =>
      this.shrink(value, shrunkOnce === true).map(v => this.shrinkableFor(v, shrunkOnce === true))
    );
  }
}

export { ArbitraryWithShrink };

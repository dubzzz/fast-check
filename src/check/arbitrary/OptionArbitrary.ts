import { Arbitrary } from './definition/Arbitrary'
import Shrinkable from './definition/Shrinkable'
import { nat } from './IntegerArbitrary'
import Random from '../../random/generator/Random'

class OptionArbitrary<T> extends Arbitrary<T | null> {
    readonly isOptionArb: Arbitrary<number>;
    constructor(readonly arb: Arbitrary<T>, readonly frequency: number) {
        super();
        this.isOptionArb = nat(frequency); // 1 chance over <frequency> to have non null
    }
    private static extendedShrinkable<T>(s: Shrinkable<T>): Shrinkable<T | null> {
        function* g(): IterableIterator<Shrinkable<T | null>> {
            yield new Shrinkable(null);
        }
        return new Shrinkable(
                s.value,
                () => s.shrink().map(OptionArbitrary.extendedShrinkable).join(g()));
    }
    generate(mrng: Random): Shrinkable<T | null> {
        return this.isOptionArb.generate(mrng).value === 0
                ? new Shrinkable(null)
                : OptionArbitrary.extendedShrinkable(this.arb.generate(mrng));
    }
}

function option<T>(arb: Arbitrary<T>): Arbitrary<T | null>;
function option<T>(arb: Arbitrary<T>, freq: number): Arbitrary<T | null>;
function option<T>(arb: Arbitrary<T>, freq?: number): Arbitrary<T | null> {
    return new OptionArbitrary(arb, freq == null ? 5 : freq);
}

export { option };

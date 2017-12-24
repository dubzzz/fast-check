import { Arbitrary, ArbitraryWithShrink } from './definition/Arbitrary'
import Shrinkable from './definition/Shrinkable'
import { nat } from './IntegerArbitrary'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import { Stream, stream } from '../../stream/Stream'

class ArrayArbitrary<T> extends Arbitrary<T[]> {
    readonly lengthArb: ArbitraryWithShrink<number>;
    constructor(readonly arb: Arbitrary<T>, maxLength: number) {
        super();
        this.lengthArb = nat(maxLength);
    }
    private wrapper(shrinkables: [Shrinkable<number>, Shrinkable<T>[]]): Shrinkable<T[]> {
        const [size, items] = shrinkables;
        return new Shrinkable(
            items.map(s => s.value),
            () => this.shrinkImpl(size, items).map(v => this.wrapper(v)));
    }
    generate(mrng: MutableRandomGenerator): Shrinkable<T[]> {
        const size = this.lengthArb.generate(mrng);
        const items = [...Array(size.value)].map(() => this.arb.generate(mrng));
        return this.wrapper([size, items]);
    }
    private shrinkImpl(size: Shrinkable<number>, items: Shrinkable<T>[]): Stream<[Shrinkable<number>, Shrinkable<T>[]]> {
        // shrinking one by one is the not the most comprehensive
        // but allows a reasonable number of entries in the shrink
        if (items.length === 0) {
            return Stream.nil<[Shrinkable<number>, Shrinkable<T>[]]>();
        }
        return size.shrink().map(l => {
                const v: [Shrinkable<number>, Shrinkable<T>[]] = [l, items.slice(items.length -l.value)];
                return v;
            }).join(items[0].shrink().map(v => {
                const out: [Shrinkable<number>, Shrinkable<T>[]] = [size, [v].concat(items.slice(1))];
                return out;
            })).join(this.shrinkImpl(this.lengthArb.shrinkableFor(size.value -1), items.slice(1)).map(vs => {
                const nSize = this.lengthArb.shrinkableFor(vs.length +1);
                const nItems = [items[0]].concat(vs[1]);
                const out: [Shrinkable<number>, Shrinkable<T>[]] = [nSize, nItems];
                return out;
            }));
    }
}

function array<T>(arb: Arbitrary<T>): Arbitrary<T[]>;
function array<T>(arb: Arbitrary<T>, maxLength: number): Arbitrary<T[]>;
function array<T>(arb: Arbitrary<T>, maxLength?: number): Arbitrary<T[]> {
    return new ArrayArbitrary<T>(arb, maxLength || 10);
}

export { array };

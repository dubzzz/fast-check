import { Arbitrary, ArbitraryWithShrink } from './definition/Arbitrary'
import Shrinkable from './definition/Shrinkable'
import { integer } from './IntegerArbitrary'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import { Stream, stream } from '../../stream/Stream'

class ArrayArbitrary<T> extends Arbitrary<T[]> {
    readonly lengthArb: ArbitraryWithShrink<number>;
    constructor(readonly arb: Arbitrary<T>,
            readonly minLength: number, maxLength: number,
            readonly preFilter: (tab: Shrinkable<T>[]) => Shrinkable<T>[] = tab => tab) {
        super();
        this.lengthArb = integer(minLength, maxLength);
    }
    private wrapper(shrinkables: [Shrinkable<number>, Shrinkable<T>[]]): Shrinkable<T[]> {
        const [sizeRaw, itemsRaw] = shrinkables;
        const items = this.preFilter(itemsRaw);
        const size = this.lengthArb.shrinkableFor(items.length);
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
                const nSize = this.lengthArb.shrinkableFor(l.value);
                const nItems = items.slice(items.length -l.value);
                const out: [Shrinkable<number>, Shrinkable<T>[]] = [nSize, nItems];
                return out;
            }).join(items[0].shrink().map(v => {
                const out: [Shrinkable<number>, Shrinkable<T>[]] = [size, [v].concat(items.slice(1))];
                return out;
            })).join(this.shrinkImpl(this.lengthArb.shrinkableFor(size.value -1), items.slice(1))
                    .filter(vs => this.minLength <= vs[1].length +1)
                    .map(vs => {
                const nSize = this.lengthArb.shrinkableFor(vs[1].length +1);
                const nItems = [items[0]].concat(vs[1]);
                const out: [Shrinkable<number>, Shrinkable<T>[]] = [nSize, nItems];
                return out;
            }));
    }
}

function array<T>(arb: Arbitrary<T>): Arbitrary<T[]>;
function array<T>(arb: Arbitrary<T>, maxLength: number): Arbitrary<T[]>;
function array<T>(arb: Arbitrary<T>, minLength: number, maxLength: number): Arbitrary<T[]>;
function array<T>(arb: Arbitrary<T>, aLength?: number, bLength?: number): Arbitrary<T[]> {
    if (bLength == null)
        return new ArrayArbitrary<T>(arb, 0, aLength == null ? 10 : aLength);
    return new ArrayArbitrary<T>(arb, aLength!, bLength);
}

export { array, ArrayArbitrary };

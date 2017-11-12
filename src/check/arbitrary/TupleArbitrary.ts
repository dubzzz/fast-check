import Arbitrary from './Arbitrary'
import MutableRandomGenerator from '../../random/generator/MutableRandomGenerator'
import Stream from '../../stream/Stream'

class GenericTupleArbitrary extends Arbitrary<any[]> {
    constructor(readonly arbs: Arbitrary<any>[]) {
        super();
    }
    generate(mrng: MutableRandomGenerator): any[] {
        return this.arbs.map(a => a.generate(mrng));
    }
}

class Tuple1Arbitrary<T1> extends Arbitrary<[T1]> {
    constructor(readonly arb1: Arbitrary<T1>) {
        super();
    }
    generate(mrng: MutableRandomGenerator): [T1] {
        const v1 = this.arb1.generate(mrng);
        return [v1] as [T1];
    }
    shrink(value: [T1]): Stream<[T1]> {
        return this.arb1.shrink(value[0]).map(v => [v] as [T1]);
    }
}
class Tuple2Arbitrary<T1,T2> extends Arbitrary<[T1,T2]> {
    readonly tupleArb: GenericTupleArbitrary;
    constructor(arb1: Arbitrary<T1>, arb2: Arbitrary<T2>) {
        super();
        this.tupleArb = new GenericTupleArbitrary([arb1, arb2]);
    }
    generate(mrng: MutableRandomGenerator): [T1,T2] {
        return this.tupleArb.generate(mrng) as [T1,T2];
    }
}
class Tuple3Arbitrary<T1,T2,T3> extends Arbitrary<[T1,T2,T3]> {
    readonly tupleArb: GenericTupleArbitrary;
    constructor(arb1: Arbitrary<T1>, arb2: Arbitrary<T2>, arb3: Arbitrary<T3>) {
        super();
        this.tupleArb = new GenericTupleArbitrary([arb1, arb2, arb3]);
    }
    generate(mrng: MutableRandomGenerator): [T1,T2,T3] {
        return this.tupleArb.generate(mrng) as [T1,T2,T3];
    }
}
class Tuple4Arbitrary<T1,T2,T3,T4> extends Arbitrary<[T1,T2,T3,T4]> {
    readonly tupleArb: GenericTupleArbitrary;
    constructor(arb1: Arbitrary<T1>, arb2: Arbitrary<T2>, arb3: Arbitrary<T3>,
            arb4: Arbitrary<T4>) {
        super();
        this.tupleArb = new GenericTupleArbitrary([arb1, arb2, arb3, arb4]);
    }
    generate(mrng: MutableRandomGenerator): [T1,T2,T3,T4] {
        return this.tupleArb.generate(mrng) as [T1,T2,T3,T4];
    }
}
class Tuple5Arbitrary<T1,T2,T3,T4,T5> extends Arbitrary<[T1,T2,T3,T4,T5]> {
    readonly tupleArb: GenericTupleArbitrary;
    constructor(arb1: Arbitrary<T1>, arb2: Arbitrary<T2>, arb3: Arbitrary<T3>,
            arb4: Arbitrary<T4>, arb5: Arbitrary<T5>) {
        super();
        this.tupleArb = new GenericTupleArbitrary([arb1, arb2, arb3, arb4, arb5]);
    }
    generate(mrng: MutableRandomGenerator): [T1,T2,T3,T4,T5] {
        return this.tupleArb.generate(mrng) as [T1,T2,T3,T4,T5];
    }
}
class Tuple6Arbitrary<T1,T2,T3,T4,T5,T6> extends Arbitrary<[T1,T2,T3,T4,T5,T6]> {
    readonly tupleArb: GenericTupleArbitrary;
    constructor(arb1: Arbitrary<T1>, arb2: Arbitrary<T2>, arb3: Arbitrary<T3>,
            arb4: Arbitrary<T4>, arb5: Arbitrary<T5>, arb6: Arbitrary<T6>) {
        super();
        this.tupleArb = new GenericTupleArbitrary([arb1, arb2, arb3, arb4, arb5, arb6]);
    }
    generate(mrng: MutableRandomGenerator): [T1,T2,T3,T4,T5,T6] {
        return this.tupleArb.generate(mrng) as [T1,T2,T3,T4,T5,T6];
    }
}
class Tuple7Arbitrary<T1,T2,T3,T4,T5,T6,T7> extends Arbitrary<[T1,T2,T3,T4,T5,T6,T7]> {
    readonly tupleArb: GenericTupleArbitrary;
    constructor(arb1: Arbitrary<T1>, arb2: Arbitrary<T2>, arb3: Arbitrary<T3>,
            arb4: Arbitrary<T4>, arb5: Arbitrary<T5>, arb6: Arbitrary<T6>,
            arb7: Arbitrary<T7>) {
        super();
        this.tupleArb = new GenericTupleArbitrary([arb1, arb2, arb3, arb4, arb5, arb6, arb7]);
    }
    generate(mrng: MutableRandomGenerator): [T1,T2,T3,T4,T5,T6,T7] {
        return this.tupleArb.generate(mrng) as [T1,T2,T3,T4,T5,T6,T7];
    }
}
class Tuple8Arbitrary<T1,T2,T3,T4,T5,T6,T7,T8> extends Arbitrary<[T1,T2,T3,T4,T5,T6,T7,T8]> {
    readonly tupleArb: GenericTupleArbitrary;
    constructor(arb1: Arbitrary<T1>, arb2: Arbitrary<T2>, arb3: Arbitrary<T3>,
            arb4: Arbitrary<T4>, arb5: Arbitrary<T5>, arb6: Arbitrary<T6>,
            arb7: Arbitrary<T7>, arb8: Arbitrary<T8>) {
        super();
        this.tupleArb = new GenericTupleArbitrary([arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8]);
    }
    generate(mrng: MutableRandomGenerator): [T1,T2,T3,T4,T5,T6,T7,T8] {
        return this.tupleArb.generate(mrng) as [T1,T2,T3,T4,T5,T6,T7,T8];
    }
}
class Tuple9Arbitrary<T1,T2,T3,T4,T5,T6,T7,T8,T9> extends Arbitrary<[T1,T2,T3,T4,T5,T6,T7,T8,T9]> {
    readonly tupleArb: GenericTupleArbitrary;
    constructor(arb1: Arbitrary<T1>, arb2: Arbitrary<T2>, arb3: Arbitrary<T3>,
            arb4: Arbitrary<T4>, arb5: Arbitrary<T5>, arb6: Arbitrary<T6>,
            arb7: Arbitrary<T7>, arb8: Arbitrary<T8>, arb9: Arbitrary<T9>) {
        super();
        this.tupleArb = new GenericTupleArbitrary([arb1, arb2, arb3, arb4, arb5, arb6, arb7, arb8, arb9]);
    }
    generate(mrng: MutableRandomGenerator): [T1,T2,T3,T4,T5,T6,T7,T8,T9] {
        return this.tupleArb.generate(mrng) as [T1,T2,T3,T4,T5,T6,T7,T8,T9];
    }
}

function tuple<T1>(arb1: Arbitrary<T1>): Tuple1Arbitrary<T1>;
function tuple<T1,T2>(arb1: Arbitrary<T1>, arb2: Arbitrary<T2>): Tuple2Arbitrary<T1,T2>;
function tuple<T1,T2,T3>(
    arb1: Arbitrary<T1>, arb2: Arbitrary<T2>, arb3: Arbitrary<T3>)
    : Tuple3Arbitrary<T1,T2,T3>;
function tuple<T1,T2,T3,T4>(
    arb1: Arbitrary<T1>, arb2: Arbitrary<T2>, arb3: Arbitrary<T3>,
    arb4: Arbitrary<T4>)
    : Tuple4Arbitrary<T1,T2,T3,T4>;
function tuple<T1,T2,T3,T4,T5>(
    arb1: Arbitrary<T1>, arb2: Arbitrary<T2>, arb3: Arbitrary<T3>,
    arb4: Arbitrary<T4>, arb5: Arbitrary<T5>)
    : Tuple5Arbitrary<T1,T2,T3,T4,T5>;
function tuple<T1,T2,T3,T4,T5,T6>(
    arb1: Arbitrary<T1>, arb2: Arbitrary<T2>, arb3: Arbitrary<T3>,
    arb4: Arbitrary<T4>, arb5: Arbitrary<T5>, arb6: Arbitrary<T6>)
    : Tuple6Arbitrary<T1,T2,T3,T4,T5,T6>;
function tuple<T1,T2,T3,T4,T5,T6,T7>(
    arb1: Arbitrary<T1>, arb2: Arbitrary<T2>, arb3: Arbitrary<T3>,
    arb4: Arbitrary<T4>, arb5: Arbitrary<T5>, arb6: Arbitrary<T6>,
    arb7: Arbitrary<T7>)
    : Tuple7Arbitrary<T1,T2,T3,T4,T5,T6,T7>;
function tuple<T1,T2,T3,T4,T5,T6,T7,T8>(
    arb1: Arbitrary<T1>, arb2: Arbitrary<T2>, arb3: Arbitrary<T3>,
    arb4: Arbitrary<T4>, arb5: Arbitrary<T5>, arb6: Arbitrary<T6>,
    arb7: Arbitrary<T7>, arb8: Arbitrary<T8>)
    : Tuple8Arbitrary<T1,T2,T3,T4,T5,T6,T7,T8>;
function tuple<T1,T2,T3,T4,T5,T6,T7,T8,T9>(
    arb1: Arbitrary<T1>, arb2: Arbitrary<T2>, arb3: Arbitrary<T3>,
    arb4: Arbitrary<T4>, arb5: Arbitrary<T5>, arb6: Arbitrary<T6>,
    arb7: Arbitrary<T7>, arb8: Arbitrary<T8>, arb9: Arbitrary<T9>)
    : Tuple9Arbitrary<T1,T2,T3,T4,T5,T6,T7,T8,T9>;
function tuple<T1,T2,T3,T4,T5,T6,T7,T8,T9>(
    arb1?: Arbitrary<T1>, arb2?: Arbitrary<T2>, arb3?: Arbitrary<T3>,
    arb4?: Arbitrary<T4>, arb5?: Arbitrary<T5>, arb6?: Arbitrary<T6>,
    arb7?: Arbitrary<T7>, arb8?: Arbitrary<T8>, arb9?: Arbitrary<T9>) {
    if (arb9) {
        return new Tuple9Arbitrary(
            arb1 as Arbitrary<T1>, arb2 as Arbitrary<T2>, arb3 as Arbitrary<T3>,
            arb4 as Arbitrary<T4>, arb5 as Arbitrary<T5>, arb6 as Arbitrary<T6>,
            arb7 as Arbitrary<T7>, arb8 as Arbitrary<T8>, arb9 as Arbitrary<T9>);
    }
    if (arb8) {
        return new Tuple8Arbitrary(
            arb1 as Arbitrary<T1>, arb2 as Arbitrary<T2>, arb3 as Arbitrary<T3>,
            arb4 as Arbitrary<T4>, arb5 as Arbitrary<T5>, arb6 as Arbitrary<T6>,
            arb7 as Arbitrary<T7>, arb8 as Arbitrary<T8>);
    }
    if (arb7) {
        return new Tuple7Arbitrary(
            arb1 as Arbitrary<T1>, arb2 as Arbitrary<T2>, arb3 as Arbitrary<T3>,
            arb4 as Arbitrary<T4>, arb5 as Arbitrary<T5>, arb6 as Arbitrary<T6>,
            arb7 as Arbitrary<T7>);
    }
    if (arb6) {
        return new Tuple6Arbitrary(
            arb1 as Arbitrary<T1>, arb2 as Arbitrary<T2>, arb3 as Arbitrary<T3>,
            arb4 as Arbitrary<T4>, arb5 as Arbitrary<T5>, arb6 as Arbitrary<T6>);
    }
    if (arb5) {
        return new Tuple5Arbitrary(
            arb1 as Arbitrary<T1>, arb2 as Arbitrary<T2>, arb3 as Arbitrary<T3>,
            arb4 as Arbitrary<T4>, arb5 as Arbitrary<T5>);
    }
    if (arb4) {
        return new Tuple4Arbitrary(
            arb1 as Arbitrary<T1>, arb2 as Arbitrary<T2>, arb3 as Arbitrary<T3>,
            arb4 as Arbitrary<T4>);
    }
    if (arb3) {
        return new Tuple3Arbitrary(
            arb1 as Arbitrary<T1>, arb2 as Arbitrary<T2>, arb3 as Arbitrary<T3>);
    }
    if (arb2) {
        return new Tuple2Arbitrary(arb1 as Arbitrary<T1>, arb2 as Arbitrary<T2>);
    }
    return new Tuple1Arbitrary(arb1 as Arbitrary<T1>);
}

export { tuple };

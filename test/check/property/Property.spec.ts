import * as assert from 'power-assert';
import RandomGenerator from '../../../src/random/generator/RandomGenerator';
import MutableRandomGenerator from '../../../src/random/generator/MutableRandomGenerator';
import Arbitrary from '../../../src/check/arbitrary/definition/Arbitrary';
import Shrinkable from '../../../src/check/arbitrary/definition/Shrinkable';
import { property } from '../../../src/check/property/Property';
import * as jsc from 'jsverify';

class NoCallGenerator implements RandomGenerator {
    next(): [number, RandomGenerator] {
        throw new Error("Method not implemented.");
    }
    min(): number {
        throw new Error("Method not implemented.");
    }
    max(): number {
        throw new Error("Method not implemented.");
    }
}
function generator(): MutableRandomGenerator {
    return new MutableRandomGenerator(new NoCallGenerator());
}

class SingleUseArbitrary<T> extends Arbitrary<T> {
    called_once: boolean = false;
    constructor(public id: T) {
        super();
    }
    generate(mrng: MutableRandomGenerator) {
        if (this.called_once) {
            throw "Arbitrary has already been called once";
        }
        this.called_once = true;
        return new Shrinkable(this.id);
    }
}
function single<T>(id: T) {
    return new SingleUseArbitrary<T>(id);
}

describe('Property', () => {
    it('Should fail if predicate fails', () => {
        const p = property(single(8), (arg: number) => {
            return false;
        });
        assert.equal(p.run(generator())[0], false, 'Property should fail');
    });
    it('Should fail if predicate throws', () => {
        const p = property(single(8), (arg: number) => {
            throw 'predicate throws';
        });
        assert.equal(p.run(generator())[0], false, 'Property should fail');
    });
    it('Should fail if predicate fails on asserts', () => {
        const p = property(single(8), (arg: number) => {
            assert.ok(false);
        });
        assert.equal(p.run(generator())[0], false, 'Property should fail');
    });
    it('Should succeed if predicate is true', () => {
        const p = property(single(8), (arg: number) => {
            return true;
        });
        assert.ok(p.run(generator())[0], 'Property should succeed');
    });
    it('Should succeeds if predicate does not return anything', () => {
        const p = property(single(8), (arg: number) => {});
        assert.ok(p.run(generator())[0], 'Property should succeed');
    });
    it('Should call and forward arbitraries one time', () => {
        let one_call_to_predicate = false;
        const arbs: [SingleUseArbitrary<number>, SingleUseArbitrary<string>, SingleUseArbitrary<string>] = [single(3), single("hello"), single("world")];
        const p = property(arbs[0], arbs[1], arbs[2], (arg1: number, arb2: string, arg3: string) => {
            if (one_call_to_predicate) {
                throw 'Predicate has already been evaluated once';
            }
            one_call_to_predicate = true;
            return arg1 === arbs[0].id;
        });
        assert.equal(one_call_to_predicate, false, 'The creation of a property should not trigger call to predicate');
        for (let idx = 0 ; idx !== arbs.length ; ++idx) {
            assert.equal(arbs[idx].called_once, false, `The creation of a property should not trigger call to generator #${idx+1}`);
        }
        assert.ok(p.run(generator())[0], 'Predicate should receive the right arguments');
        assert.ok(one_call_to_predicate, 'Predicate should have been called by run');
        for (let idx = 0 ; idx !== arbs.length ; ++idx) {
            assert.ok(arbs[idx].called_once, `Generator #${idx+1} should have been called by run`);
        }
    });
});

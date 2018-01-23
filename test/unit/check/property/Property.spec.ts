import * as assert from 'power-assert';

import { property } from '../../../../src/check/property/Property';
import MutableRandomGenerator from '../../../../src/random/generator/MutableRandomGenerator';

import { SingleUseArbitrary } from '../../stubs/arbitraries';
import { NoCallGenerator } from '../../stubs/generators';

function generator(): MutableRandomGenerator {
    return new MutableRandomGenerator(new NoCallGenerator());
}

function single<T>(id: T) {
    return new SingleUseArbitrary<T>(id);
}

describe('Property', () => {
    it('Should fail if predicate fails', () => {
        const p = property(single(8), (arg: number) => {
            return false;
        });
        assert.notEqual(p.run(p.generate(generator()).value), null, 'Property should fail');
    });
    it('Should fail if predicate throws', () => {
        const p = property(single(8), (arg: number) => {
            throw 'predicate throws';
        });
        assert.equal(p.run(p.generate(generator()).value), 'predicate throws', 'Property should fail and attach the exception as string');
    });
    it('Should fail if predicate fails on asserts', () => {
        const p = property(single(8), (arg: number) => {
            assert.ok(false);
        });
        let expected = "";
        try { assert.ok(false); } catch (err) { expected = `${err}`; }

        const out = p.run(p.generate(generator()).value);
        assert.ok(out!.startsWith(expected), 'Property should fail and attach the exception as string');
        assert.ok(out!.indexOf('\n\nStack trace:') !== -1, 'Property should include the stack trace when available');
    });
    it('Should succeed if predicate is true', () => {
        const p = property(single(8), (arg: number) => {
            return true;
        });
        assert.equal(p.run(p.generate(generator()).value), null, 'Property should succeed');
    });
    it('Should succeed if predicate does not return anything', () => {
        const p = property(single(8), (arg: number) => {});
        assert.equal(p.run(p.generate(generator()).value), null, 'Property should succeed');
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
        assert.equal(p.run(p.generate(generator()).value), null, 'Predicate should receive the right arguments');
        assert.ok(one_call_to_predicate, 'Predicate should have been called by run');
        for (let idx = 0 ; idx !== arbs.length ; ++idx) {
            assert.ok(arbs[idx].called_once, `Generator #${idx+1} should have been called by run`);
        }
    });
});

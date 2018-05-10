import * as assert from 'assert';

import Arbitrary from '../../../../src/check/arbitrary/definition/Arbitrary';
import Shrinkable from '../../../../src/check/arbitrary/definition/Shrinkable';
import { property } from '../../../../src/check/property/Property';

import * as stubArb from '../../stubs/arbitraries';
import * as stubRng from '../../stubs/generators';

describe('Property', () => {
  it('Should fail if predicate fails', () => {
    const p = property(stubArb.single(8), (arg: number) => {
      return false;
    });
    assert.notEqual(p.run(p.generate(stubRng.mutable.nocall()).value), null, 'Property should fail');
  });
  it('Should fail if predicate throws', () => {
    const p = property(stubArb.single(8), (arg: number) => {
      throw 'predicate throws';
    });
    assert.equal(
      p.run(p.generate(stubRng.mutable.nocall()).value),
      'predicate throws',
      'Property should fail and attach the exception as string'
    );
  });
  it('Should fail if predicate fails on asserts', () => {
    const p = property(stubArb.single(8), (arg: number) => {
      assert.ok(false);
    });
    const out = p.run(p.generate(stubRng.mutable.nocall()).value);
    assert.ok(
      out!.startsWith('AssertionError [ERR_ASSERTION]: false == true'),
      `Property should fail and attach the exception as string, got: ${out}`
    );
    assert.ok(out!.indexOf('\n\nStack trace:') !== -1, 'Property should include the stack trace when available');
  });
  it('Should succeed if predicate is true', () => {
    const p = property(stubArb.single(8), (arg: number) => {
      return true;
    });
    assert.equal(p.run(p.generate(stubRng.mutable.nocall()).value), null, 'Property should succeed');
  });
  it('Should succeed if predicate does not return anything', () => {
    const p = property(stubArb.single(8), (arg: number) => {});
    assert.equal(p.run(p.generate(stubRng.mutable.nocall()).value), null, 'Property should succeed');
  });
  it('Should call and forward arbitraries one time', () => {
    let one_call_to_predicate = false;
    const arbs: [
      stubArb.SingleUseArbitrary<number>,
      stubArb.SingleUseArbitrary<string>,
      stubArb.SingleUseArbitrary<string>
    ] = [stubArb.single(3), stubArb.single('hello'), stubArb.single('world')];
    const p = property(arbs[0], arbs[1], arbs[2], (arg1: number, arb2: string, arg3: string) => {
      if (one_call_to_predicate) {
        throw 'Predicate has already been evaluated once';
      }
      one_call_to_predicate = true;
      return arg1 === arbs[0].id;
    });
    assert.equal(one_call_to_predicate, false, 'The creation of a property should not trigger call to predicate');
    for (let idx = 0; idx !== arbs.length; ++idx) {
      assert.equal(
        arbs[idx].called_once,
        false,
        `The creation of a property should not trigger call to generator #${idx + 1}`
      );
    }
    assert.equal(
      p.run(p.generate(stubRng.mutable.nocall()).value),
      null,
      'Predicate should receive the right arguments'
    );
    assert.ok(one_call_to_predicate, 'Predicate should have been called by run');
    for (let idx = 0; idx !== arbs.length; ++idx) {
      assert.ok(arbs[idx].called_once, `Generator #${idx + 1} should have been called by run`);
    }
  });
  it('Should throw on invalid arbitrary', () =>
    assert.throws(() => property(stubArb.single(8), stubArb.single(8), <Arbitrary<any>>{}, () => {})));
  it('Should use the unbiased arbitrary by default', () => {
    const p = property(
      new class extends Arbitrary<number> {
        generate(): Shrinkable<number> {
          return new Shrinkable(69);
        }
        withBias(): Arbitrary<number> {
          throw 'Should not call withBias if not forced to';
        }
      }(),
      () => {}
    );
    assert.equal(p.generate(stubRng.mutable.nocall()).value, 69);
  });
  it('Should use the biased arbitrary when asked to', () => {
    const p = property(
      new class extends Arbitrary<number> {
        generate(): Shrinkable<number> {
          return new Shrinkable(69);
        }
        withBias(freq: number): Arbitrary<number> {
          if (typeof freq !== 'number' || freq < 2) {
            throw new Error(`freq atribute must always be superior or equal to 2, got: ${freq}`);
          }
          return new class extends Arbitrary<number> {
            generate(): Shrinkable<number> {
              return new Shrinkable(42);
            }
          }();
        }
      }(),
      () => {}
    );
    assert.equal(p.generate(stubRng.mutable.nocall(), 0).value, 42);
    assert.equal(p.generate(stubRng.mutable.nocall(), 2).value, 42);
  });
});

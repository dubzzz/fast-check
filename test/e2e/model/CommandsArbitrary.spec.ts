import * as assert from 'assert';
import * as fc from '../../../src/fast-check';

type M1 = { count: number };
type R1 = {};

class IncreaseCommand implements fc.Command<M1, R1> {
  check = (m: Readonly<M1>) => true;
  run = (m: M1, r: R1) => {
    m.count += 1;
  };
  toString = () => 'inc';
}
class DecreaseCommand implements fc.Command<M1, R1> {
  check = (m: Readonly<M1>) => true;
  run = (m: M1, r: R1) => {
    m.count -= 1;
  };
  toString = () => 'dec';
}
class EvenCommand implements fc.Command<M1, R1> {
  check = (m: Readonly<M1>) => m.count % 2 === 0;
  run = (m: M1, r: R1) => {};
  toString = () => 'even';
}
class OddCommand implements fc.Command<M1, R1> {
  check = (m: Readonly<M1>) => m.count % 2 !== 0;
  run = (m: M1, r: R1) => {};
  toString = () => 'odd';
}
class CheckLessThanCommand implements fc.Command<M1, R1> {
  constructor(readonly lessThanValue: number) {}
  check = (m: Readonly<M1>) => true;
  run = (m: M1, r: R1) => {
    assert.ok(m.count < this.lessThanValue);
  };
  toString = () => `check[${this.lessThanValue}]`;
}
class SuccessAlwaysCommand implements fc.Command<M1, R1> {
  check = (m: Readonly<M1>) => true;
  run = (m: M1, r: R1) => {};
  toString = () => 'success';
}

type M2 = {
  current: { stepId: number };
  validSteps: number[];
};
type R2 = {};

class SuccessCommand implements fc.Command<M2, R2> {
  check = (m: Readonly<M2>) => m.validSteps.includes(m.current.stepId++);
  run = (m: M2, r: R2) => {};
  toString = () => 'success';
}
class FailureCommand implements fc.Command<M2, R2> {
  check = (m: Readonly<M2>) => m.validSteps.includes(m.current.stepId++);
  run = (m: M2, r: R2) => {
    throw 'failure';
  };
  toString = () => 'failure';
}

const seed = Date.now();
describe(`CommandsArbitrary (seed: ${seed})`, () => {
  describe('commands', () => {
    it('Should shrink up sto the shortest failing commands list', () => {
      const out = fc.check(
        fc.property(
          fc.commands(
            [
              fc.constant(new IncreaseCommand()),
              fc.constant(new DecreaseCommand()),
              fc.constant(new EvenCommand()),
              fc.constant(new OddCommand()),
              fc.integer(1, 10).map(v => new CheckLessThanCommand(v))
            ],
            1000
          ),
          cmds => {
            const setup = () => ({
              model: { count: 0 },
              real: {}
            });
            fc.modelRun(setup, cmds);
          }
        ),
        { seed: seed }
      );
      assert.ok(out.failed, 'Should have failed');

      const cmdsRepr = out.counterexample![0].toString();
      const m = /check\[(\d+)\]$/.exec(cmdsRepr);
      assert.notEqual(m, null, `Expected to end by a check[..] command, got: ${cmdsRepr}`);
      assert.equal(cmdsRepr, 'inc,check[1]', `Expected the only played command to be 'inc,check[1]', got: ${cmdsRepr}`);
    });
    it('Should result in empty commands if failures happen after the run', () => {
      const out = fc.check(
        fc.property(fc.commands([fc.constant(new SuccessAlwaysCommand())]), cmds => {
          const setup = () => ({
            model: { count: 0 },
            real: {}
          });
          fc.modelRun(setup, cmds);
          return false; // fails after the model, no matter the commands
        }),
        { seed: seed }
      );
      assert.ok(out.failed, 'Should have failed');
      assert.equal([...out.counterexample![0]].length, 0);
    });
    it('Should shrink towards minimal case even with other arbitraries', () => {
      // Why this test?
      //
      // fc.commands is one of the rare Arbitrary relying on an internal state.
      // By generating commands along with other arbitraries, we could highlight states issues.
      // Basically shrinking will re-use the generated commands multiple times along with a shrunk array.
      //
      // First version was failing on this test with the following output:
      // Expected the only played command to be 'failure', got: -,success,failure for steps 2
      // The output for 'steps 2' should have been '-,-,failure'
      const out = fc.check(
        fc.property(
          fc.array(fc.nat(9), 0, 3),
          fc.commands([fc.constant(new FailureCommand()), fc.constant(new SuccessCommand())]),
          fc.array(fc.nat(9), 0, 3),
          (validSteps1, cmds, validSteps2) => {
            const setup = () => ({
              model: { current: { stepId: 0 }, validSteps: [...validSteps1, ...validSteps2] },
              real: {}
            });
            fc.modelRun(setup, cmds);
          }
        ),
        { seed: seed }
      );
      assert.ok(out.failed, 'Should have failed');
      const cmdsRepr = out.counterexample![1].toString();
      const validSteps = [...out.counterexample![0], ...out.counterexample![2]];
      assert.equal(
        cmdsRepr,
        'failure',
        `Expected the only played command to be 'failure', got: ${cmdsRepr} for steps ${validSteps.sort().join(',')}`
      );
    });
  });
});

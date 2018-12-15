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

const seed = Date.now();
describe(`CommandsArbitrary (seed: ${seed})`, () => {
  describe('commands', () => {
    it('Should print only the commands corresponding to the failure', () => {
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

      const limit = +m![1];
      const expectedRepr = `${[...Array(limit)].map(_ => 'inc').join(',')},check[${limit}]`;
      assert.equal(cmdsRepr, expectedRepr);

      // TODO: Use this expect instead
      // assert.equal(cmdsRepr, 'inc,check[1]', `Expected the only played command to be 'inc,check[1]', got: ${cmdsRepr}`);
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
  });
});

import * as fc from '../../../src/fast-check';
import { FailureCommand, SuccessCommand } from './StepCommands';
import {
  IncreaseCommand,
  DecreaseCommand,
  EvenCommand,
  OddCommand,
  CheckLessThanCommand,
  SuccessAlwaysCommand,
} from './CounterCommands';
import { seed } from '../seed';

describe(`CommandsArbitrary (seed: ${seed})`, () => {
  describe('commands', () => {
    it('Should shrink up to the shortest failing commands list', () => {
      const out = fc.check(
        fc.property(
          fc.commands(
            [
              fc.nat().map((n) => new IncreaseCommand(n)),
              fc.nat().map((n) => new DecreaseCommand(n)),
              fc.constant(new EvenCommand()),
              fc.constant(new OddCommand()),
              fc.nat().map((n) => new CheckLessThanCommand(n + 1)),
            ],
            { disableReplayLog: true, size: '+2' }
          ),
          (cmds) => {
            const setup = () => ({
              model: { count: 0 },
              real: {},
            });
            fc.modelRun(setup, cmds);
          }
        ),
        { seed: seed }
      );
      expect(out.failed).toBe(true);

      const cmdsRepr = out.counterexample![0].toString();
      expect(cmdsRepr).toMatch(/check\[(\d+)\]$/);
      expect(cmdsRepr).toEqual('inc[1],check[1]');
    });
    it('Should result in empty commands if failures happen after the run', () => {
      const out = fc.check(
        fc.property(fc.commands([fc.constant(new SuccessAlwaysCommand())]), (cmds) => {
          const setup = () => ({
            model: { count: 0 },
            real: {},
          });
          fc.modelRun(setup, cmds);
          return false; // fails after the model, no matter the commands
        }),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect([...out.counterexample![0]]).toHaveLength(0);
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
          fc.array(fc.nat(9), { maxLength: 3 }),
          fc.commands([fc.constant(new FailureCommand()), fc.constant(new SuccessCommand())], {
            disableReplayLog: true,
          }),
          fc.array(fc.nat(9), { maxLength: 3 }),
          (validSteps1, cmds, validSteps2) => {
            const setup = () => ({
              model: { current: { stepId: 0 }, validSteps: [...validSteps1, ...validSteps2] },
              real: {},
            });
            fc.modelRun(setup, cmds);
          }
        ),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(out.counterexample![1].toString()).toEqual('failure');
    });
    it('Should not start a run with already started commands', () => {
      // Why this test?
      // fc.commands relies on cloning not to waste the hasRan status of an execution
      // between two runs it is supposed to clone the commands before resetting the hasRan flag
      const unexpectedPartiallyExecuted: string[] = [];
      const out = fc.check(
        fc.property(
          fc.array(fc.nat(9), { maxLength: 3 }),
          fc.commands([fc.constant(new FailureCommand()), fc.constant(new SuccessCommand())], {
            disableReplayLog: true,
          }),
          fc.array(fc.nat(9), { maxLength: 3 }),
          (validSteps1, cmds, validSteps2) => {
            if (String(cmds) !== '') {
              // When no command has been started, String(cmds) === ''
              // Having String(cmds) !== '' implies that some commands have the hasRan flag ON
              unexpectedPartiallyExecuted.push(String(cmds));
            }
            const setup = () => ({
              model: { current: { stepId: 0 }, validSteps: [...validSteps1, ...validSteps2] },
              real: {},
            });
            fc.modelRun(setup, cmds);
          }
        ),
        { seed: seed }
      );
      expect(out.failed).toBe(true);
      expect(unexpectedPartiallyExecuted).toEqual([]);
    });
  });
});

import prand from 'pure-rand';
import * as fc from '../../../../../lib/fast-check';

import { Command } from '../../../../../src/check/model/command/Command';
import { Random } from '../../../../../src/random/generator/Random';
import { constant } from '../../../../../src/check/arbitrary/ConstantArbitrary';
import { commands } from '../../../../../src/check/model/commands/CommandsArbitrary';
import { genericTuple } from '../../../../../src/check/arbitrary/TupleArbitrary';
import { nat } from '../../../../../src/check/arbitrary/IntegerArbitrary';
import { Arbitrary } from '../../../../../src/check/arbitrary/definition/Arbitrary';
import { Shrinkable } from '../../../../../src/check/arbitrary/definition/Shrinkable';

type Model = {};
type Real = {};
type Cmd = Command<Model, Real>;

const model: Model = Object.freeze({});
const real: Real = Object.freeze({});

class SuccessCommand implements Cmd {
  constructor(readonly log: { data: string[] }) {}
  check = () => {
    this.log.data.push(this.toString());
    return true;
  };
  run = () => {};
  toString = () => 'success';
}
class SkippedCommand implements Cmd {
  constructor(readonly log: { data: string[] }) {}
  check = () => {
    this.log.data.push(this.toString());
    return false;
  };
  run = () => {};
  toString = () => 'skipped';
}
class FailureCommand implements Cmd {
  constructor(readonly log: { data: string[] }) {}
  check = () => {
    this.log.data.push(this.toString());
    return true;
  };
  run = () => {
    throw 'error';
  };
  toString = () => 'failure';
}

describe('CommandWrapper', () => {
  describe('commands', () => {
    const simulateCommands = (cmds: Iterable<Cmd>) => {
      for (const c of cmds) {
        if (!c.check(model)) continue;
        try {
          c.run(model, real);
        } catch (err) {
          return;
        }
      }
    };
    it('Should generate a cloneable shrinkable', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          let logOnCheck: { data: string[] } = { data: [] };

          const baseCommands = commands([
            constant(new SuccessCommand(logOnCheck)),
            constant(new SkippedCommand(logOnCheck)),
            constant(new FailureCommand(logOnCheck))
          ]).generate(mrng);

          return baseCommands.hasToBeCloned;
        })
      ));
    it('Should skip skipped commands on shrink', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          let logOnCheck: { data: string[] } = { data: [] };

          const baseCommands = commands([
            constant(new SuccessCommand(logOnCheck)),
            constant(new SkippedCommand(logOnCheck)),
            constant(new FailureCommand(logOnCheck))
          ]).generate(mrng);
          simulateCommands(baseCommands.value);

          for (const shrunkCmds of baseCommands.shrink()) {
            logOnCheck.data = [];
            [...shrunkCmds.value].forEach(c => c.check(model));
            expect(logOnCheck.data.every(e => e !== 'skipped')).toBe(true);
          }
        })
      ));
    it('Should shrink with failure at the end', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          let logOnCheck: { data: string[] } = { data: [] };

          const baseCommands = commands([
            constant(new SuccessCommand(logOnCheck)),
            constant(new SkippedCommand(logOnCheck)),
            constant(new FailureCommand(logOnCheck))
          ]).generate(mrng);
          simulateCommands(baseCommands.value);

          fc.pre(logOnCheck.data[logOnCheck.data.length - 1] === 'failure');

          for (const shrunkCmds of baseCommands.shrink()) {
            logOnCheck.data = [];
            [...shrunkCmds.value].forEach(c => c.check(model));
            if (logOnCheck.data.length > 0) {
              // either empty or ending by the failure
              expect(logOnCheck.data[logOnCheck.data.length - 1]).toEqual('failure');
            }
          }
        })
      ));
    it('Should shrink with at most one failure and all successes', () =>
      fc.assert(
        fc.property(fc.integer(), (seed: number) => {
          const mrng = new Random(prand.xorshift128plus(seed));
          let logOnCheck: { data: string[] } = { data: [] };

          const baseCommands = commands([
            constant(new SuccessCommand(logOnCheck)),
            constant(new SkippedCommand(logOnCheck)),
            constant(new FailureCommand(logOnCheck))
          ]).generate(mrng);
          simulateCommands(baseCommands.value);

          for (const shrunkCmds of baseCommands.shrink()) {
            logOnCheck.data = [];
            [...shrunkCmds.value].forEach(c => c.check(model));
            expect(logOnCheck.data.every(e => e === 'failure' || e === 'success')).toBe(true);
            expect(logOnCheck.data.filter(e => e === 'failure').length <= 1).toBe(true);
          }
        })
      ));
    it('Should provide commands which have not run yet', () => {
      const commandsArb = commands([constant(new SuccessCommand({ data: [] }))]);
      const arbs = genericTuple([nat(16), commandsArb, nat(16)] as Arbitrary<any>[]);
      const assertCommandsNotStarted = (shrinkable: Shrinkable<[number, Iterable<Cmd>, number]>) => {
        expect(String(shrinkable.value_[1])).toEqual('');
      };
      const startCommands = (shrinkable: Shrinkable<[number, Iterable<Cmd>, number]>) => {
        for (const cmd of shrinkable.value_[1]) cmd.run({}, {});
      };
      fc.assert(
        fc.property(fc.integer().noShrink(), fc.infiniteStream(fc.nat()), (seed, shrinkPath) => {
          // Generate the first shrinkable
          const it = shrinkPath[Symbol.iterator]();
          const mrng = new Random(prand.xorshift128plus(seed));
          let shrinkable: Shrinkable<[number, Iterable<Cmd>, number]> | null = arbs.generate(mrng) as any;

          // Check status and update first shrinkable
          assertCommandsNotStarted(shrinkable!);
          startCommands(shrinkable!);

          // Traverse the shrink tree in order to detect already seen ids
          while (shrinkable !== null) {
            shrinkable = shrinkable
              .shrink()
              .map(nextShrinkable => {
                // Check nothing starting for the next one
                assertCommandsNotStarted(nextShrinkable);
                // Start everything: not supposed to impact any other shrinkable
                startCommands(nextShrinkable);
                return nextShrinkable;
              })
              .getNthOrLast(it.next().value);
          }
        })
      );
    });
  });
});

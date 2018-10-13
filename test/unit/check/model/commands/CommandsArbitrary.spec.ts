import * as assert from 'assert';
import prand from 'pure-rand';
import * as fc from '../../../../../lib/fast-check';

import { Command } from '../../../../../src/check/model/command/Command';
import { Random } from '../../../../../src/random/generator/Random';
import { constant } from '../../../../../src/check/arbitrary/ConstantArbitrary';
import { commands } from '../../../../../src/check/model/commands/CommandsArbitrary';

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
            assert.ok(logOnCheck.data.every(e => e !== 'skipped'));
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

          const lastWasFailure = logOnCheck.data[logOnCheck.data.length - 1] === 'failure';
          const initialData = [...logOnCheck.data];
          fc.pre(lastWasFailure);

          for (const shrunkCmds of baseCommands.shrink()) {
            logOnCheck.data = [];
            [...shrunkCmds.value].forEach(c => c.check(model));
            assert.ok(
              logOnCheck.data.length === 0 || logOnCheck.data[logOnCheck.data.length - 1] === 'failure',
              `Shrunk initial data ${initialData.join(',')} into ${logOnCheck.data.join(',')}`
            );
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
            assert.ok(logOnCheck.data.every(e => e === 'failure' || e === 'success'));
            assert.ok(logOnCheck.data.filter(e => e === 'failure').length <= 1);
          }
        })
      ));
  });
});

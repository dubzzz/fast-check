import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

import { CommandWrapper } from '../../../../../src/check/model/commands/CommandWrapper';
import { CommandsIterable } from '../../../../../src/check/model/commands/CommandsIterable';
import type { Command } from '../../../../../src/check/model/command/Command';
import { cloneMethod } from '../../../../../src/check/symbols';

type Model = Record<string, unknown>;
type Real = unknown;

const buildAlreadyRanCommands = (runFlags: boolean[]) => {
  return runFlags.map((hasRun, idx) => {
    const cmd = new (class implements Command<Model, Real> {
      check = (_m: Readonly<Model>) => true;
      run = (_m: Model, _r: Real) => {};
      toString = () => String(idx);
    })();
    const wrapper = new CommandWrapper(cmd);
    if (hasRun) {
      wrapper.run({}, {});
    }
    return wrapper;
  });
};

describe('CommandsIterable', () => {
  it('Should not reset hasRun flag on iteration', () =>
    fc.assert(
      fc.property(fc.array(fc.boolean()), (runFlags) => {
        const commands = [...new CommandsIterable(buildAlreadyRanCommands(runFlags), () => '')];
        for (let idx = 0; idx !== runFlags.length; ++idx) {
          expect(commands[idx].hasRan).toEqual(runFlags[idx]);
        }
      }),
    ));
  it('Should not reset hasRun flag on the original iterable on clone', () =>
    fc.assert(
      fc.property(fc.array(fc.boolean()), (runFlags) => {
        const originalIterable = new CommandsIterable(buildAlreadyRanCommands(runFlags), () => '');
        originalIterable[cloneMethod]();
        const commands = [...originalIterable];
        for (let idx = 0; idx !== runFlags.length; ++idx) {
          expect(commands[idx].hasRan).toEqual(runFlags[idx]);
        }
      }),
    ));
  it('Should reset hasRun flag for the clone on clone', () =>
    fc.assert(
      fc.property(fc.array(fc.boolean()), (runFlags) => {
        const commands = [...new CommandsIterable(buildAlreadyRanCommands(runFlags), () => '')[cloneMethod]()];
        for (let idx = 0; idx !== runFlags.length; ++idx) {
          expect(commands[idx].hasRan).toBe(false);
        }
      }),
    ));
  it('Should only print ran commands and metadata if any', () =>
    fc.assert(
      fc.property(fc.array(fc.boolean()), fc.string({ unit: 'binary' }), (runFlags, metadata) => {
        const commandsIterable = new CommandsIterable(buildAlreadyRanCommands(runFlags), () => metadata);
        const expectedCommands = runFlags
          .map((hasRan, idx) => (hasRan ? String(idx) : ''))
          .filter((s) => s !== '')
          .join(',');
        const expectedToString = metadata.length !== 0 ? `${expectedCommands} /*${metadata}*/` : expectedCommands;
        expect(commandsIterable.toString()).toEqual(expectedToString);
      }),
    ));
});

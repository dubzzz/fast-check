import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { commands } from '../../../src/arbitrary/commands';

import prand from 'pure-rand';
import type { Command } from '../../../src/check/model/command/Command';
import { Random } from '../../../src/random/generator/Random';
import { Arbitrary } from '../../../src/check/arbitrary/definition/Arbitrary';
import { Value } from '../../../src/check/arbitrary/definition/Value';
import { Stream } from '../../../src/stream/Stream';
import { tuple } from '../../../src/arbitrary/tuple';
import { nat } from '../../../src/arbitrary/nat';
import { isStrictlySmallerArray } from './__test-helpers__/ArrayHelpers';

type Model = Record<string, unknown>;
type Real = unknown;
type Cmd = Command<Model, Real>;

const model: Model = Object.freeze({});
const real: Real = Object.freeze({});

describe('commands (integration)', () => {
  function simulateCommands(cmds: Iterable<Cmd>): void {
    for (const c of cmds) {
      if (!c.check(model)) continue;
      try {
        c.run(model, real);
      } catch {
        return;
      }
    }
  }

  it('should generate a cloneable instance', () => {
    fc.assert(
      fc.property(fc.integer(), fc.option(fc.integer({ min: 2 }), { nil: undefined }), (seed, biasFactor) => {
        // Arrange
        const mrng = new Random(prand.xorshift128plus(seed));
        const logOnCheck: { data: string[] } = { data: [] };

        // Act
        const commandsArb = commands([
          new FakeConstant(new SuccessCommand(logOnCheck)),
          new FakeConstant(new SkippedCommand(logOnCheck)),
          new FakeConstant(new FailureCommand(logOnCheck)),
        ]);
        const baseCommands = commandsArb.generate(mrng, biasFactor);

        // Assert
        return baseCommands.hasToBeCloned;
      }),
    );
  });
  it('should skip skipped commands on shrink', () => {
    fc.assert(
      fc.property(fc.integer(), fc.option(fc.integer({ min: 2 }), { nil: undefined }), (seed, biasFactor) => {
        // Arrange
        const mrng = new Random(prand.xorshift128plus(seed));
        const logOnCheck: { data: string[] } = { data: [] };

        // Act
        const commandsArb = commands([
          new FakeConstant(new SuccessCommand(logOnCheck)),
          new FakeConstant(new SkippedCommand(logOnCheck)),
          new FakeConstant(new FailureCommand(logOnCheck)),
        ]);
        const baseCommands = commandsArb.generate(mrng, biasFactor);
        simulateCommands(baseCommands.value);

        // Assert
        const shrinks = commandsArb.shrink(baseCommands.value_, baseCommands.context);
        for (const shrunkCmds of shrinks) {
          logOnCheck.data = [];
          [...shrunkCmds.value].forEach((c) => c.check(model));
          expect(logOnCheck.data.every((e) => e !== 'skipped')).toBe(true);
        }
      }),
    );
  });

  it('should shrink with failure at the end', () => {
    fc.assert(
      fc.property(fc.integer(), fc.option(fc.integer({ min: 2 }), { nil: undefined }), (seed, biasFactor) => {
        // Arrange
        const mrng = new Random(prand.xorshift128plus(seed));
        const logOnCheck: { data: string[] } = { data: [] };

        // Act
        const commandsArb = commands([
          new FakeConstant(new SuccessCommand(logOnCheck)),
          new FakeConstant(new SkippedCommand(logOnCheck)),
          new FakeConstant(new FailureCommand(logOnCheck)),
        ]);
        const baseCommands = commandsArb.generate(mrng, biasFactor);
        simulateCommands(baseCommands.value);
        fc.pre(logOnCheck.data[logOnCheck.data.length - 1] === 'failure');

        // Assert
        const shrinks = commandsArb.shrink(baseCommands.value_, baseCommands.context);
        for (const shrunkCmds of shrinks) {
          logOnCheck.data = [];
          [...shrunkCmds.value].forEach((c) => c.check(model));
          if (logOnCheck.data.length > 0) {
            // either empty or ending by the failure
            expect(logOnCheck.data[logOnCheck.data.length - 1]).toEqual('failure');
          }
        }
      }),
    );
  });

  it('should shrink with at most one failure and all successes', () => {
    fc.assert(
      fc.property(fc.integer(), fc.option(fc.integer({ min: 2 }), { nil: undefined }), (seed, biasFactor) => {
        // Arrange
        const mrng = new Random(prand.xorshift128plus(seed));
        const logOnCheck: { data: string[] } = { data: [] };

        // Act
        const commandsArb = commands([
          new FakeConstant(new SuccessCommand(logOnCheck)),
          new FakeConstant(new SkippedCommand(logOnCheck)),
          new FakeConstant(new FailureCommand(logOnCheck)),
        ]);
        const baseCommands = commandsArb.generate(mrng, biasFactor);
        simulateCommands(baseCommands.value);

        // Assert
        const shrinks = commandsArb.shrink(baseCommands.value_, baseCommands.context);
        for (const shrunkCmds of shrinks) {
          logOnCheck.data = [];
          [...shrunkCmds.value].forEach((c) => c.check(model));
          expect(logOnCheck.data.every((e) => e === 'failure' || e === 'success')).toBe(true);
          expect(logOnCheck.data.filter((e) => e === 'failure').length <= 1).toBe(true);
        }
      }),
    );
  });

  it('should provide commands which have never run', () => {
    const commandsArb = commands([new FakeConstant(new SuccessCommand({ data: [] }))], {
      disableReplayLog: true,
    });
    const manyArbsIncludingCommandsOne = tuple(nat(16), commandsArb, nat(16));
    const assertCommandsNotStarted = (value: Value<[number, Iterable<Cmd>, number]>) => {
      // Check the commands have never been executed
      // by checking the toString of the iterable is empty
      expect(String(value.value_[1])).toEqual('');
    };
    const startCommands = (value: Value<[number, Iterable<Cmd>, number]>) => {
      // Iterate over all the generated commands to run them all
      let ranOneCommand = false;
      for (const cmd of value.value_[1]) {
        ranOneCommand = true;
        cmd.run({}, {});
      }
      // Confirming that executing at least one command will make the toString of the iterable
      // not empty
      if (ranOneCommand) {
        expect(String(value.value_[1])).not.toEqual('');
      }
    };
    fc.assert(
      fc.property(
        fc.noShrink(fc.integer()),
        fc.infiniteStream(fc.nat()),
        fc.option(fc.integer({ min: 2 }), { nil: undefined }),
        (seed, shrinkPath, biasFactor) => {
          // Generate the first Value
          const it = shrinkPath[Symbol.iterator]();
          const mrng = new Random(prand.xorshift128plus(seed));
          let currentValue: Value<[number, Iterable<Cmd>, number]> | null = manyArbsIncludingCommandsOne.generate(
            mrng,
            biasFactor,
          );

          // Check status and update first Value
          assertCommandsNotStarted(currentValue);
          startCommands(currentValue);

          // Traverse the shrink tree in order to detect already seen ids
          while (currentValue !== null) {
            currentValue = manyArbsIncludingCommandsOne
              .shrink(currentValue.value_, currentValue.context)
              .map((nextValue) => {
                // Check nothing starting for the next one
                assertCommandsNotStarted(nextValue);
                // Start everything: not supposed to impact any other shrinkable
                startCommands(nextValue);
                return nextValue;
              })
              .getNthOrLast(it.next().value);
          }
        },
      ),
    );
  });

  it('should shrink to smaller values', () => {
    const commandsArb = commands([nat(3).map((id) => new SuccessIdCommand(id))]);
    fc.assert(
      fc.property(
        fc.noShrink(fc.integer()),
        fc.infiniteStream(fc.nat()),
        fc.option(fc.integer({ min: 2 }), { nil: undefined }),
        (seed, shrinkPath, biasFactor) => {
          // Generate the first Value
          const it = shrinkPath[Symbol.iterator]();
          const mrng = new Random(prand.xorshift128plus(seed));
          let currentValue: Value<Iterable<Cmd>> | null = commandsArb.generate(mrng, biasFactor);

          // Run all commands of first Value
          simulateCommands(currentValue.value_);

          // Traverse the shrink tree in order to detect already seen ids
          const extractIdRegex = /^custom\((\d+)\)$/;
          while (currentValue !== null) {
            const currentItems = [...currentValue.value_].map((c) => +extractIdRegex.exec(c.toString())![1]);
            currentValue = commandsArb
              .shrink(currentValue.value_, currentValue.context)
              .map((nextValue) => {
                // Run all commands of nextShrinkable
                simulateCommands(nextValue.value_);
                // Check nextShrinkable is strictly smaller than current one
                const nextItems = [...nextValue.value_].map((c) => +extractIdRegex.exec(c.toString())![1]);
                expect(isStrictlySmallerArray(nextItems, currentItems)).toBe(true);
                // Next is eligible for shrinking
                return nextValue;
              })
              .getNthOrLast(it.next().value);
          }
        },
      ),
    );
  });

  it('should shrink the same way when based on replay data', () => {
    fc.assert(
      fc.property(
        fc.noShrink(fc.integer()),
        fc.nat(100),
        fc.option(fc.integer({ min: 2 }), { nil: undefined }),
        (seed, numValues, biasFactor) => {
          // create unused logOnCheck
          const logOnCheck: { data: string[] } = { data: [] };

          // generate scenario and simulate execution
          const rng = prand.xorshift128plus(seed);
          const refArbitrary = commands([
            new FakeConstant(new SuccessCommand(logOnCheck)),
            new FakeConstant(new SkippedCommand(logOnCheck)),
            new FakeConstant(new FailureCommand(logOnCheck)),
            nat().map((v) => new SuccessIdCommand(v)),
          ]);
          const refValue: Value<Iterable<Cmd>> = refArbitrary.generate(new Random(rng), biasFactor);
          simulateCommands(refValue.value_);

          // trigger computation of replayPath
          // and extract shrinks for ref
          const refShrinks = [
            ...refArbitrary
              .shrink(refValue.value_, refValue.context)
              .take(numValues)
              .map((s) => [...s.value_].map((c) => c.toString())),
          ];

          // extract replayPath
          const replayPath = /\/\*replayPath=['"](.*)['"]\*\//.exec(refValue.value_.toString())![1];

          // generate scenario but do not simulate execution
          const noExecArbitrary = commands(
            [
              new FakeConstant(new SuccessCommand(logOnCheck)),
              new FakeConstant(new SkippedCommand(logOnCheck)),
              new FakeConstant(new FailureCommand(logOnCheck)),
              nat().map((v) => new SuccessIdCommand(v)),
            ],
            { replayPath },
          );
          const noExecValue: Value<Iterable<Cmd>> = noExecArbitrary.generate(new Random(rng), biasFactor);

          // check shrink values are identical
          const noExecShrinks = [
            ...noExecArbitrary
              .shrink(noExecValue.value_, noExecValue.context)
              .take(numValues)
              .map((s) => [...s.value_].map((c) => c.toString())),
          ];
          expect(noExecShrinks).toEqual(refShrinks);
        },
      ),
    );
  });
});

// Helpers

class FakeConstant extends Arbitrary<Cmd> {
  constructor(private readonly cmd: Cmd) {
    super();
  }
  generate(): Value<Cmd> {
    return new Value(this.cmd, undefined);
  }
  canShrinkWithoutContext(value: unknown): value is Cmd {
    return false;
  }
  shrink(): Stream<Value<Cmd>> {
    return Stream.nil();
  }
}

class SuccessIdCommand implements Cmd {
  constructor(readonly id: number) {}
  check = () => true;
  run = () => {};
  toString = () => `custom(${this.id})`;
}

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

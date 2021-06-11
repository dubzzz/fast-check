import * as fc from '../../src/fast-check';
import * as prand from 'pure-rand';
import { seed } from './seed';

// Fake commands
type Model = { counter: number };
type Real = unknown;
class IncBy implements fc.Command<Model, Real> {
  constructor(readonly v: number) {}
  check = (_m: Readonly<Model>) => true;
  run = (m: Model, _r: Real) => (m.counter += this.v);
  toString = () => `IncBy(${this.v})`;
}
class DecPosBy implements fc.Command<Model, Real> {
  constructor(readonly v: number) {}
  check = (m: Readonly<Model>) => m.counter > 0;
  run = (m: Model, _r: Real) => (m.counter -= this.v);
  toString = () => `DecPosBy(${this.v})`;
}
class AlwaysPos implements fc.Command<Model, Real> {
  check = (_m: Readonly<Model>) => true;
  run = (m: Model, _r: Real) => {
    if (m.counter < 0) throw new Error('counter is supposed to be always greater or equal to zero');
  };
  toString = () => `AlwaysPos()`;
}

describe(`ReplayCommands (seed: ${seed})`, () => {
  const buildProp = (replayPath?: string, mrng?: fc.Random) => {
    let alreadyFailed = false;
    let skipAllRuns = false;
    return fc.property(
      fc.commands(
        [fc.nat().map((v) => new IncBy(v)), fc.nat().map((v) => new DecPosBy(v)), fc.constant(new AlwaysPos())],
        {
          replayPath,
        }
      ),
      (cmds) => {
        if (alreadyFailed && mrng !== undefined) {
          // Simulate the behaviour of skipAllAfterTimeLimit
          skipAllRuns = skipAllRuns || mrng.nextDouble() < 0.05;
          fc.pre(!skipAllRuns);
        }
        try {
          fc.modelRun(() => ({ model: { counter: 0 }, real: {} }), cmds);
        } catch (err) {
          alreadyFailed = true;
          throw err;
        }
      }
    );
  };
  it('Should be able to replay commands by specifying replayPath in fc.commands', () => {
    const out = fc.check(buildProp(), { seed: seed });
    expect(out.failed).toBe(true);

    const path = out.counterexamplePath!;
    const replayPath = /\/\*replayPath=['"](.*)['"]\*\//.exec(out.counterexample![0].toString())![1];

    const outReplayed = fc.check(buildProp(replayPath), { seed, path });
    expect(outReplayed.counterexamplePath).toEqual(out.counterexamplePath);
    expect(outReplayed.counterexample![0].toString()).toEqual(out.counterexample![0].toString());
    expect(outReplayed.numRuns).toEqual(1);
  });
  it('Should be able to resume a stopped run by specifying replayPath in fc.commands', () => {
    const mrng = new fc.Random(prand.mersenne(seed));
    const out = fc.check(buildProp(undefined, mrng), { seed: seed });
    expect(out.failed).toBe(true);

    const path = out.counterexamplePath!;
    const replayPath = /\/\*replayPath=['"](.*)['"]\*\//.exec(out.counterexample![0].toString())![1];

    const outReplayed = fc.check(buildProp(replayPath), { seed, path });
    expect(outReplayed.counterexamplePath).toContain(out.counterexamplePath);
    expect(outReplayed.counterexamplePath!.startsWith(out.counterexamplePath!)).toBe(true);
  });
});

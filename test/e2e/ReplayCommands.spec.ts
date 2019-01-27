import * as fc from '../../src/fast-check';

// Fake commands
type Model = { counter: number };
type Real = {};
class IncBy implements fc.Command<Model, Real> {
  constructor(readonly v: number) {}
  check = (m: Readonly<Model>) => true;
  run = (m: Model, r: Real) => (m.counter += this.v);
  toString = () => `IncBy(${this.v})`;
}
class DecPosBy implements fc.Command<Model, Real> {
  constructor(readonly v: number) {}
  check = (m: Readonly<Model>) => m.counter > 0;
  run = (m: Model, r: Real) => (m.counter -= this.v);
  toString = () => `DecPosBy(${this.v})`;
}
class AlwaysPos implements fc.Command<Model, Real> {
  check = (m: Readonly<Model>) => true;
  run = (m: Model, r: Real) => {
    if (m.counter < 0) throw new Error('counter is supposed to be always greater or equal to zero');
  };
  toString = () => `AlwaysPos()`;
}

const seed = Date.now();
describe(`ReplayCommands (seed: ${seed})`, () => {
  it('Should be able to replay commands by specifying replayPath in fc.commands', () => {
    const buildProp = (replayPath?: string) => {
      return fc.property(
        fc.commands(
          [fc.nat().map(v => new IncBy(v)), fc.nat().map(v => new DecPosBy(v)), fc.constant(new AlwaysPos())],
          { replayPath }
        ),
        cmds => fc.modelRun(() => ({ model: { counter: 0 }, real: {} }), cmds)
      );
    };

    const out = fc.check(buildProp(), { seed: seed });
    expect(out.failed).toBe(true);

    const path = out.counterexamplePath!;
    const replayPath = /\/\*replayPath=['"](.*)['"]\*\//.exec(out.counterexample![0].toString())![1];

    const outReplayed = fc.check(buildProp(replayPath), { seed, path });
    expect(outReplayed.counterexamplePath).toEqual(out.counterexamplePath);
    expect(outReplayed.counterexample![0].toString()).toEqual(out.counterexample![0].toString());
    expect(outReplayed.numRuns).toEqual(1);
  });
});

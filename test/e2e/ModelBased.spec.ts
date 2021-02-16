import * as fc from '../../src/fast-check';
import { seed } from './seed';

interface IList<T> {
  push(v: T): void;
  pop(): T;
  size(): number;
}

interface Model {
  num: number;
}

class PushCommand implements fc.Command<Model, IList<number>> {
  constructor(readonly value: number) {}
  check = (_m: Readonly<Model>) => true;
  run(m: Model, r: IList<number>): void {
    r.push(this.value);
    ++m.num;
  }
  toString = () => `push(${this.value})`;
}
class PopCommand implements fc.Command<Model, IList<number>> {
  check(m: Readonly<Model>): boolean {
    // should not call pop on empty list
    return m.num > 0;
  }
  run(m: Model, r: IList<number>): void {
    expect(typeof r.pop()).toEqual('number');
    --m.num;
  }
  toString = () => 'pop';
}
class SizeCommand implements fc.Command<Model, IList<number>> {
  check = (_m: Readonly<Model>) => true;
  run(m: Model, r: IList<number>): void {
    expect(r.size()).toEqual(m.num);
  }
  toString = () => 'size';
}
const allCommands = [
  fc.integer().map((v) => new PushCommand(v)),
  fc.constant(new PopCommand()),
  fc.constant(new SizeCommand()),
];

describe(`Model Based (seed: ${seed})`, () => {
  it('should not detect any issue on built-in list', () => {
    fc.assert(
      fc.property(fc.commands(allCommands, { maxCommands: 100 }), (cmds) => {
        class BuiltinList implements IList<number> {
          data: number[] = [];
          push = (v: number) => this.data.push(v);
          pop = () => this.data.pop()!;
          size = () => this.data.length;
        }
        const s = () => ({ model: { num: 0 }, real: new BuiltinList() });
        fc.modelRun(s, cmds);
      })
    );
  });
  it('should detect an issue on fixed size circular list', () => {
    const out = fc.check(
      fc.property(fc.integer({ min: 1, max: 1000 }), fc.commands(allCommands, { maxCommands: 100 }), (size, cmds) => {
        class CircularList implements IList<number> {
          start = 0;
          end = 0;
          data: number[];
          constructor(len: number) {
            this.data = [...Array(len)].fill(null);
          }
          push = (v: number) => {
            this.data[this.end] = v;
            this.end = (this.end + 1) % this.data.length;
          };
          pop = () => {
            this.end = (this.end - 1 + this.data.length) % this.data.length;
            return this.data[this.end];
          };
          size = () => (this.end - this.start + this.data.length) % this.data.length;
        }
        const s = () => ({ model: { num: 0 }, real: new CircularList(size) });
        fc.modelRun(s, cmds);
      })
    );
    expect(out.failed).toBe(true);
  });
});

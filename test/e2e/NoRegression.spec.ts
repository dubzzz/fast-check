import fc from '../../src/fast-check';
import {
  IncreaseCommand,
  DecreaseCommand,
  EvenCommand,
  OddCommand,
  CheckLessThanCommand
} from './model/CounterCommands';

const testFunc = (value: unknown) => {
  const repr = fc.stringify(value);
  for (let idx = 1; idx < repr.length; ++idx) {
    if (repr[idx - 1] === repr[idx] && repr[idx] !== '"') {
      return false;
    }
  }
  return true;
};

describe(`NoRegression`, () => {
  // Bumping from one patch of fast-check to another is not supposed
  // to change the values that will be generated by the framework.
  //
  // Except in case of a real bug causing the arbitrary to be totally unusable.
  //
  // This suite checks this invariant stays true.
  // Moreover, the framework should build consistent values throughout all the versions of node.
  const settings = { seed: 42, verbose: 2 };

  it('float', () => {
    expect(() => fc.assert(fc.property(fc.float(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('double', () => {
    expect(() => fc.assert(fc.property(fc.double(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('integer', () => {
    expect(() => fc.assert(fc.property(fc.integer(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('nat', () => {
    expect(() => fc.assert(fc.property(fc.nat(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('maxSafeInteger', () => {
    expect(() =>
      fc.assert(fc.property(fc.maxSafeInteger(), v => testFunc(v)), settings)
    ).toThrowErrorMatchingSnapshot();
  });
  it('maxSafeNat', () => {
    expect(() => fc.assert(fc.property(fc.maxSafeNat(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('string', () => {
    expect(() => fc.assert(fc.property(fc.string(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('asciiString', () => {
    expect(() => fc.assert(fc.property(fc.asciiString(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  // // Jest Snapshot seems not to support incomplete surrogate pair correctly
  // it('string16bits', () => {
  //   expect(() => fc.assert(fc.property(fc.string16bits(), v => testFunc(v + v)), settings)).toThrowErrorMatchingSnapshot();
  // });
  it('stringOf', () => {
    expect(() =>
      fc.assert(fc.property(fc.stringOf(fc.constantFrom('a', 'b')), v => testFunc(v)), settings)
    ).toThrowErrorMatchingSnapshot();
  });
  it('unicodeString', () => {
    expect(() =>
      fc.assert(fc.property(fc.unicodeString(), v => testFunc(v + v)), settings)
    ).toThrowErrorMatchingSnapshot();
  });
  it('fullUnicodeString', () => {
    expect(() =>
      fc.assert(fc.property(fc.fullUnicodeString(), v => testFunc(v + v)), settings)
    ).toThrowErrorMatchingSnapshot();
  });
  it('hexaString', () => {
    expect(() => fc.assert(fc.property(fc.hexaString(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('base64String', () => {
    expect(() => fc.assert(fc.property(fc.base64String(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('lorem', () => {
    expect(() => fc.assert(fc.property(fc.lorem(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('mapToConstant', () => {
    expect(() =>
      fc.assert(
        fc.property(
          fc.mapToConstant({ num: 26, build: v => String.fromCharCode(v + 0x61) }),
          fc.mapToConstant({ num: 26, build: v => String.fromCharCode(v + 0x61) }),
          (a, b) => testFunc(a + b)
        ),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
  it('option', () => {
    expect(() =>
      fc.assert(fc.property(fc.option(fc.nat()), v => testFunc(v)), settings)
    ).toThrowErrorMatchingSnapshot();
  });
  it('oneof', () => {
    expect(() =>
      fc.assert(fc.property(fc.oneof<any>(fc.nat(), fc.char()), v => testFunc(v)), settings)
    ).toThrowErrorMatchingSnapshot();
  });
  it('frequency', () => {
    expect(() =>
      fc.assert(
        fc.property(
          fc.frequency<any>({ weight: 1, arbitrary: fc.nat() }, { weight: 5, arbitrary: fc.char() }),
          testFunc
        ),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
  it('dedup', () => {
    expect(() =>
      fc.assert(fc.property(fc.dedup(fc.nat(), 2), v => testFunc(v)), settings)
    ).toThrowErrorMatchingSnapshot();
  });
  it('shuffledSubarray', () => {
    expect(() =>
      fc.assert(
        fc.property(fc.shuffledSubarray([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]), v => testFunc(v)),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
  it('subarray', () => {
    expect(() =>
      fc.assert(fc.property(fc.subarray([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]), v => testFunc(v)), settings)
    ).toThrowErrorMatchingSnapshot();
  });
  it('array', () => {
    expect(() => fc.assert(fc.property(fc.array(fc.nat()), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('infiniteStream', () => {
    expect(() =>
      fc.assert(fc.property(fc.infiniteStream(fc.nat()), s => testFunc([...s.take(10)])), settings)
    ).toThrowErrorMatchingSnapshot();
  });
  it('set', () => {
    expect(() => fc.assert(fc.property(fc.set(fc.nat()), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('tuple', () => {
    expect(() =>
      fc.assert(fc.property(fc.tuple(fc.nat(), fc.nat()), v => testFunc(v)), settings)
    ).toThrowErrorMatchingSnapshot();
  });
  it('record', () => {
    expect(() =>
      fc.assert(
        fc.property(fc.record({ k1: fc.nat(), k2: fc.nat() }, { withDeletedKeys: true }), v => testFunc(v)),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
  it('dictionary', () => {
    expect(() =>
      fc.assert(fc.property(fc.dictionary(fc.string(), fc.nat()), v => testFunc(v)), settings)
    ).toThrowErrorMatchingSnapshot();
  });
  it('anything', () => {
    expect(() => fc.assert(fc.property(fc.anything(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('object', () => {
    expect(() => fc.assert(fc.property(fc.object(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('json', () => {
    expect(() => fc.assert(fc.property(fc.json(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('jsonObject', () => {
    expect(() => fc.assert(fc.property(fc.jsonObject(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('unicodeJson', () => {
    expect(() => fc.assert(fc.property(fc.unicodeJson(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('unicodeJsonObject', () => {
    expect(() =>
      fc.assert(fc.property(fc.unicodeJsonObject(), v => testFunc(v)), settings)
    ).toThrowErrorMatchingSnapshot();
  });
  it('compareFunc', () => {
    expect(() =>
      fc.assert(fc.property(fc.compareFunc(), f => testFunc(f(1, 2))), settings)
    ).toThrowErrorMatchingSnapshot();
  });
  it('func', () => {
    expect(() =>
      fc.assert(fc.property(fc.func(fc.nat()), f => testFunc(f())), settings)
    ).toThrowErrorMatchingSnapshot();
  });
  it('ipV4', () => {
    expect(() => fc.assert(fc.property(fc.ipV4(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('ipV4Extended', () => {
    expect(() => fc.assert(fc.property(fc.ipV4Extended(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('ipV6', () => {
    expect(() => fc.assert(fc.property(fc.ipV6(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('domain', () => {
    expect(() => fc.assert(fc.property(fc.domain(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('webAuthority', () => {
    expect(() => fc.assert(fc.property(fc.webAuthority(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('webSegment', () => {
    expect(() => fc.assert(fc.property(fc.webSegment(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('webFragments', () => {
    expect(() => fc.assert(fc.property(fc.webFragments(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('webQueryParameters', () => {
    expect(() =>
      fc.assert(fc.property(fc.webQueryParameters(), v => testFunc(v)), settings)
    ).toThrowErrorMatchingSnapshot();
  });
  it('webUrl', () => {
    expect(() => fc.assert(fc.property(fc.webUrl(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('emailAddress', () => {
    expect(() => fc.assert(fc.property(fc.emailAddress(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('date', () => {
    expect(() => fc.assert(fc.property(fc.date(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('uuid', () => {
    expect(() => fc.assert(fc.property(fc.uuid(), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('uuidV', () => {
    expect(() => fc.assert(fc.property(fc.uuidV(4), v => testFunc(v)), settings)).toThrowErrorMatchingSnapshot();
  });
  it('letrec', () => {
    expect(() =>
      fc.assert(
        fc.property(
          fc.letrec(tie => ({
            // Trick to be able to shrink from node to leaf
            tree: fc.nat(1).chain(id => (id === 0 ? tie('leaf') : tie('node'))),
            node: fc.record({ left: tie('tree'), right: tie('tree') }),
            leaf: fc.nat(21)
          })).tree,
          v => testFunc(v)
        ),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
  it('commands', () => {
    expect(() =>
      fc.assert(
        fc.property(
          fc.commands([
            fc.nat().map(n => new IncreaseCommand(n)),
            fc.nat().map(n => new DecreaseCommand(n)),
            fc.constant(new EvenCommand()),
            fc.constant(new OddCommand()),
            fc.nat().map(n => new CheckLessThanCommand(n + 1))
          ]),
          cmds => {
            const setup = () => ({
              model: { count: 0 },
              real: {}
            });
            try {
              fc.modelRun(setup, cmds);
              return true;
            } catch (err) {
              return false;
            }
          }
        ),
        settings
      )
    ).toThrowErrorMatchingSnapshot();
  });
  it('scheduler', async () => {
    await expect(
      fc.assert(
        fc.asyncProperty(fc.scheduler(), async s => {
          const received = [] as string[];
          for (const v of ['a', 'b', 'c']) {
            s.schedule(Promise.resolve(v)).then(out => {
              received.push(out);
              s.schedule(Promise.resolve(out.toUpperCase())).then(out2 => {
                received.push(out2);
              });
            });
          }
          await s.waitAll();
          expect(received.join('')).not.toContain('aBc');
        }),
        settings
      )
    ).rejects.toThrowErrorMatchingSnapshot();
  });
});

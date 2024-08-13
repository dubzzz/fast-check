import { describe, it, expect } from 'vitest';
import fc from '../../src/fast-check';
import { asyncRunWithSanitizedStack, runWithSanitizedStack } from './__test-helpers__/StackSanitizer';
import {
  IncreaseCommand,
  DecreaseCommand,
  EvenCommand,
  OddCommand,
  CheckLessThanCommand,
} from './model/CounterCommands';

const testFunc = (value: unknown) => {
  const repr = fc
    .stringify(value)
    .replace(/^(|Big)(Int|Uint|Float)(8|16|32|64)(|Clamped)Array\.from\((.*)\)$/, '$5')
    .replace(/__proto__:null,/g, '')
    .replace(/__proto__:null/g, '');
  for (let idx = 1; idx < repr.length; ++idx) {
    if (repr[idx - 1] === repr[idx] && repr[idx] !== '"' && repr[idx] !== '}') {
      return false;
    }
  }
  return true;
};

// Bumping from one patch of fast-check to another is not supposed
// to change the values that will be generated by the framework.
//
// Except in case of a real bug causing the arbitrary to be totally unusable.
//
// This suite checks this invariant stays true.
// Moreover, the framework should build consistent values throughout all the versions of node.
const settings = { seed: 42, verbose: 2 };

describe(`NoRegression`, () => {
  it('.filter', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(
            fc.nat().filter((n) => n % 3 !== 0),
            (v) => testFunc(v),
          ),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('.map', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(
            fc.nat().map((n) => String(n)),
            (v) => testFunc(v),
          ),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('.chain', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(
            fc.nat(20).chain((n) => fc.clone(fc.nat(n), n)),
            (v) => testFunc(v),
          ),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('float', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.float(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('gen', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.gen(), (gen) => {
            const v1 = gen(fc.integer);
            const v2 = gen(fc.integer);
            return testFunc(`${v1}-${v2}`);
          }),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('double', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.double(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('integer', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.integer(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('nat', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.nat(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('maxSafeInteger', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.maxSafeInteger(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('maxSafeNat', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.maxSafeNat(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('string', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.string(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('asciiString', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.asciiString(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  // // Jest Snapshot seems not to support incomplete surrogate pair correctly
  // it('string16bits', () => {
  //   expect(runWithSanitizedStack(() => fc.assert(fc.property(fc.string16bits(), v => testFunc(v + v)), settings))).toThrowErrorMatchingSnapshot();
  // });
  it('stringOf', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.stringOf(fc.constantFrom('a', 'b')), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('stringMatching', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.stringMatching(/(^|\s)a+[^a][b-eB-E]+[^b-eB-E](\s|$)/), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('unicodeString', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.unicodeString(), (v) => testFunc(v + v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('fullUnicodeString', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.fullUnicodeString(), (v) => testFunc(v + v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('hexaString', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.hexaString(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('base64String', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.base64String(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('lorem', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.lorem(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('mapToConstant', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(
            fc.mapToConstant({ num: 26, build: (v) => String.fromCharCode(v + 0x61) }),
            fc.mapToConstant({ num: 26, build: (v) => String.fromCharCode(v + 0x61) }),
            (a, b) => testFunc(a + b),
          ),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('option', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.option(fc.nat()), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('oneof', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.oneof<any>(fc.nat(), fc.char()), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('oneof[weighted]', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.oneof<any>({ weight: 1, arbitrary: fc.nat() }, { weight: 5, arbitrary: fc.char() }), testFunc),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('clone', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.clone(fc.nat(), 2), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('shuffledSubarray', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.shuffledSubarray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), (v) =>
            testFunc(v.join('')),
          ),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('subarray', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.subarray([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), (v) =>
            testFunc(v.join('')),
          ),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('array', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.array(fc.nat()), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('sparseArray', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(
            fc.sparseArray(fc.nat()),
            (v) =>
              // Sum of first element of each group should be less or equal to 10
              // If a group starts at index 0, the whole group is ignored
              Object.entries(v).reduce((acc, [index, cur]) => {
                if (index === '0' || v[Number(index) - 1] !== undefined) return acc;
                else return acc + cur;
              }, 0) <= 10,
          ),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('sparseArray({noTrailingHole:true})', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(
            fc.sparseArray(fc.nat(), { noTrailingHole: true }),
            (v) =>
              // Sum of first element of each group should be less or equal to 10
              // If a group starts at index 0, the whole group is ignored
              Object.entries(v).reduce((acc, [index, cur]) => {
                if (index === '0' || v[Number(index) - 1] !== undefined) return acc;
                else return acc + cur;
              }, 0) <= 10,
          ),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('infiniteStream', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.infiniteStream(fc.nat()), (s) => testFunc([...s.take(10)])),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('uniqueArray', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.uniqueArray(fc.nat()), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('uniqueArray', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.uniqueArray(fc.nat()), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('tuple', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.tuple(fc.nat(), fc.nat()), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('limitShrink', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.limitShrink(fc.nat(), 4), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('int8Array', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.int8Array(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('uint8Array', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.uint8Array(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('uint8ClampedArray', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.uint8ClampedArray(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('int16Array', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.int16Array(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('uint16Array', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.uint16Array(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('int32Array', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.int32Array(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('uint32Array', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.uint32Array(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('float32Array', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.float32Array(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('float64Array', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.float64Array(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('record', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.record({ k1: fc.nat(), k2: fc.nat() }, { requiredKeys: [] }), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('dictionary', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.dictionary(fc.string(), fc.nat()), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('anything', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.anything(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('object', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.object(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('json', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.json(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('jsonValue', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.jsonValue(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('compareFunc', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.compareFunc(), (f) => testFunc(f(1, 2))),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('func', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.func(fc.nat()), (f) => testFunc(f())),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('ipV4', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.ipV4(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('ipV4Extended', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.ipV4Extended(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('ipV6', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.ipV6(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('domain', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.domain(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('webAuthority', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.webAuthority(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('webSegment', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.webSegment(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('webFragments', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.webFragments(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('webQueryParameters', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.webQueryParameters(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('webPath', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.webPath(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('webUrl', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.webUrl(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('emailAddress', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.emailAddress(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('date', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.date(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('ulid', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.ulid(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('uuid', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.uuid(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('uuidV', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.uuidV(4), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('letrec', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(
            fc.letrec((tie) => ({
              // Trick to be able to shrink from node to leaf
              tree: fc.nat(1).chain((id) => (id === 0 ? tie('leaf') : tie('node'))),
              node: fc.record({ left: tie('tree'), right: tie('tree') }),
              leaf: fc.nat(21),
            })).tree,
            (v) => testFunc(v),
          ),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('letrec (oneof:maxDepth)', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(
            fc.letrec((tie) => ({
              tree: fc.oneof({ withCrossShrink: true, maxDepth: 2 }, tie('leaf'), tie('node')),
              node: fc.record({ a: tie('tree'), b: tie('tree'), c: tie('tree') }),
              leaf: fc.nat(21),
            })).tree,
            (v) => testFunc(v),
          ),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('letrec (oneof:depthSize)', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(
            fc.letrec((tie) => ({
              tree: fc.oneof({ withCrossShrink: true, depthSize: 'small' }, tie('leaf'), tie('node')),
              node: fc.record({ a: tie('tree'), b: tie('tree'), c: tie('tree') }),
              leaf: fc.nat(21),
            })).tree,
            (v) => testFunc(v),
          ),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('commands', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(
            fc.commands([
              fc.nat().map((n) => new IncreaseCommand(n)),
              fc.nat().map((n) => new DecreaseCommand(n)),
              fc.constant(new EvenCommand()),
              fc.constant(new OddCommand()),
              fc.nat().map((n) => new CheckLessThanCommand(n + 1)),
            ]),
            (cmds) => {
              const setup = () => ({
                model: { count: 0 },
                real: {},
              });
              try {
                fc.modelRun(setup, cmds);
                return true;
              } catch (err) {
                return false;
              }
            },
          ),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('context', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.context(), fc.nat(), (ctx, v) => {
            ctx.log(`Value was ${v}`);
            return testFunc(v);
          }),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });

  it('Promise<number>', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(
            fc.integer().map((v) => [v, Promise.resolve(v)] as const),
            ([v, _p]) => testFunc(v),
          ),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('user defined examples', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.string(), (v) => testFunc(v)),
          { ...settings, examples: [['hi'], ['hello'], ['hey']] },
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('user defined examples (including not shrinkable values)', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(
            // Shrinkable: built-in
            fc.nat(),
            // Cannot shrinking: missing unmapper
            fc.nat().map((v) => String(v)),
            // Shrinkable: unmapper provided
            fc.nat().map(
              (v) => String(v),
              (v) => Number(v),
            ),
            // Shrinkable: filter can shrink given the value to shrink matches the predicate
            fc.nat().filter((v) => v % 2 === 0),
            (a, b, c, d) => testFunc([a, b, c, d]),
          ),
          {
            ...settings,
            examples: [
              [1, '2', '3', 4],
              [5, '6', '7', 8],
              [9, '10', '11', 12],
              [13, '14', '15', 16],
              [17, '18', '19', 20],
            ],
          },
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigIntN', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.bigIntN(100), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigUintN', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.bigUintN(100), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigInt', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.bigInt(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigInt({min})', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.bigInt({ min: BigInt(1) << BigInt(16) }), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigInt({max})', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.bigInt({ max: BigInt(1) << BigInt(64) }), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigInt({min, max})', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.bigInt({ min: BigInt(1) << BigInt(16), max: BigInt(1) << BigInt(64) }), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigUint', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.bigUint(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigUint({max})', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.bigUint({ max: BigInt(1) << BigInt(96) }), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigInt64Array', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.bigInt64Array(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('bigUint64Array', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.bigUint64Array(), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('mixedCase', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.mixedCase(fc.constant('cCbAabBAcaBCcCACcABaCAaAabBACaBcBb')), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
  it('mixedCase(stringOf)', () => {
    expect(
      runWithSanitizedStack(() =>
        fc.assert(
          fc.property(fc.mixedCase(fc.stringOf(fc.constantFrom('a', 'b', 'c'))), (v) => testFunc(v)),
          settings,
        ),
      ),
    ).toThrowErrorMatchingSnapshot();
  });
});

describe(`NoRegression (async)`, () => {
  const asyncNumber = fc.integer().map((v) => Promise.resolve(v));

  it('scheduler', async () => {
    await expect(
      asyncRunWithSanitizedStack(
        async () =>
          await fc.assert(
            fc.asyncProperty(fc.scheduler(), async (s) => {
              const received = [] as string[];
              for (const v of ['a', 'b', 'c']) {
                s.schedule(Promise.resolve(v)).then((out) => {
                  received.push(out);
                  s.schedule(Promise.resolve(out.toUpperCase())).then((out2) => {
                    received.push(out2);
                  });
                });
              }
              await s.waitAll();
              return !received.join('').includes('aBc');
            }),
            settings,
          ),
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  });
  it('number', async () => {
    await expect(
      asyncRunWithSanitizedStack(
        async () =>
          await fc.assert(
            fc.asyncProperty(fc.integer(), async (v) => testFunc(v)),
            settings,
          ),
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('.map (to Promise)', async () => {
    await expect(
      asyncRunWithSanitizedStack(
        async () =>
          await fc.assert(
            fc.asyncProperty(asyncNumber, async (v) => testFunc(await v)),
            settings,
          ),
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('func (to Promise)', async () => {
    await expect(
      asyncRunWithSanitizedStack(
        async () =>
          await fc.assert(
            fc.asyncProperty(fc.func(asyncNumber), async (f) => testFunc(await f())),
            settings,
          ),
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('infiniteStream (to Promise)', async () => {
    await expect(
      asyncRunWithSanitizedStack(
        async () =>
          await fc.assert(
            fc.asyncProperty(fc.infiniteStream(asyncNumber), async (s) => testFunc(await Promise.all([...s.take(10)]))),
            settings,
          ),
      ),
    ).rejects.toThrowErrorMatchingSnapshot();
  });
});

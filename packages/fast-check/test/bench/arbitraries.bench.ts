import { describe, bench } from 'vitest';
import type { Arbitrary, Memo } from '../../src/fast-check.js';
import { fc, mrng } from './__test-helpers__/Imports.js';

type BenchCase = {
  name: string;
  arbitrary: Arbitrary<unknown>;
};

const largeLength = { maxLength: 100, size: 'max' as const };

const letrec = () => {
  const { tree } = fc.letrec((tie) => ({
    tree: fc.oneof(tie('leaf'), tie('node')),
    node: fc.record({ left: tie('tree'), right: tie('tree') }),
    leaf: fc.nat(),
  }));
  return tree;
};
const memo = () => {
  const leaf = fc.nat;
  // oxlint-disable-next-line no-use-before-define -- `tree` and `node` reference each other
  const tree: Memo<unknown> = fc.memo((n) => fc.oneof(node(n), leaf()));
  const node: Memo<unknown> = fc.memo((n) => {
    if (n <= 1) return fc.record({ left: leaf(), right: leaf() });
    return fc.record({ left: tree(), right: tree() });
  });
  return tree(3);
};

const benchCases: BenchCase[] = [
  // Numeric and primitive values
  { name: 'boolean()', arbitrary: fc.boolean() },
  { name: 'integer()', arbitrary: fc.integer() },
  { name: 'maxSafeInteger()', arbitrary: fc.maxSafeInteger() },
  { name: 'bigInt()', arbitrary: fc.bigInt() },
  { name: 'float()', arbitrary: fc.float() },
  { name: 'double()', arbitrary: fc.double() },
  { name: 'date()', arbitrary: fc.date() },

  // Strings (default small size, an explicit larger size and a non-ASCII unit)
  { name: 'string()', arbitrary: fc.string() },
  { name: "string({ maxLength: 100, size: 'max' })", arbitrary: fc.string(largeLength) },
  { name: "string({ unit: 'grapheme' })", arbitrary: fc.string({ unit: 'grapheme' }) },
  { name: 'base64String()', arbitrary: fc.base64String() },

  // Collections (default small size and an explicit larger size for the bulk path)
  { name: 'array(integer())', arbitrary: fc.array(fc.integer()) },
  { name: "array(integer(), { maxLength: 100, size: 'max' })", arbitrary: fc.array(fc.integer(), largeLength) },
  { name: 'uniqueArray(integer())', arbitrary: fc.uniqueArray(fc.integer()) },
  { name: 'set(integer())', arbitrary: fc.set(fc.integer()) },
  { name: 'tuple(integer())', arbitrary: fc.tuple(fc.integer()) },
  { name: 'record({ a: integer() })', arbitrary: fc.record({ a: fc.integer() }) },
  { name: 'dictionary(string(), integer())', arbitrary: fc.dictionary(fc.string(), fc.integer()) },
  { name: 'map(string(), integer())', arbitrary: fc.map(fc.string(), fc.integer()) },

  // Choice and combinators
  { name: 'constantFrom(...)', arbitrary: fc.constantFrom('a', 'b', 'c', 'd', 'e') },
  { name: 'oneof(integer(), integer())', arbitrary: fc.oneof(fc.integer(), fc.integer()) },
  {
    name: 'oneof({ weight, arbitrary }, ...)',
    arbitrary: fc.oneof({ arbitrary: fc.integer(), weight: 1 }, { arbitrary: fc.integer(), weight: 2 }),
  },
  { name: 'option(integer())', arbitrary: fc.option(fc.integer()) },
  { name: 'subarray([1, 2, 3, 4, 5])', arbitrary: fc.subarray([1, 2, 3, 4, 5]) },

  // Recursive structures
  { name: 'letrec(tree)', arbitrary: letrec() },
  { name: 'memo(tree)', arbitrary: memo() },

  // Structured data
  { name: 'anything()', arbitrary: fc.anything() },
  { name: 'json()', arbitrary: fc.json() },
  {
    name: 'entityGraph(node -> node)',
    arbitrary: fc.entityGraph({ node: { id: fc.integer() } }, { node: { linkTo: { arity: 'many', type: 'node' } } }),
  },

  // Formatted strings (web and identifiers)
  { name: 'emailAddress()', arbitrary: fc.emailAddress() },
  { name: 'webUrl()', arbitrary: fc.webUrl() },
  { name: 'ipV4()', arbitrary: fc.ipV4() },
  { name: 'ipV6()', arbitrary: fc.ipV6() },
  { name: 'uuid()', arbitrary: fc.uuid() },
  { name: 'stringMatching(/^[a-zA-Z0-9]+$/)', arbitrary: fc.stringMatching(/^[a-zA-Z0-9]+$/) },
  {
    // A common URL-shaped regex chosen to exercise most of the stringMatching AST branches at once:
    // alternation (Disjunction), groups, the four quantifiers (?, +, *, {n,m}), positive and negated
    // character classes, class ranges, meta classes (\w, \d, \s, \S), literals and anchors.
    name: 'stringMatching(url regex)',
    arbitrary: fc.stringMatching(/^(https?|ftp):\/\/([\w-]+\.)+[a-z]{2,6}(:\d+)?(\/[^\s?#]*)?(\?\S*)?$/),
  },
  { name: 'mixedCase(string())', arbitrary: fc.mixedCase(fc.string()) },

  // Operators chained on top of another arbitrary
  { name: 'integer().map(.)', arbitrary: fc.integer().map((n) => n + 1) },
  { name: 'integer().chain(.)', arbitrary: fc.integer().chain(() => fc.integer()) },
  { name: 'integer().filter(.)', arbitrary: fc.integer().filter((n) => n % 2 === 0) },
];

const biasFactor = 3;

// Pre warm-up
for (const benchCase of benchCases) {
  benchCase.arbitrary.generate(mrng, biasFactor);
}

// Benchmark
describe('generate', () => {
  for (const benchCase of benchCases) {
    bench(benchCase.name, () => {
      benchCase.arbitrary.generate(mrng, biasFactor);
    });
  }
});

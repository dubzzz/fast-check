// Benchmark suites covering core arbitraries across various configurations.
// Each suite represents a representative call site: generation + (optionally) shrinking.
// To add coverage, append entries to SUITES. Each entry is { suite, name, setup }.
// `setup` returns a `run` function called repeatedly. Optionally returns `{ run, rng, reset }`.

import { bench, printResult } from './harness.mjs';
import { xorshift128plus } from 'pure-rand/generator/xorshift128plus';

const fc = await import(new URL(process.env.PERF_TARGET || './../lib/fast-check.js', import.meta.url).href);
const { Random } = fc;

function mkRng(seed = 42) {
  return new Random(xorshift128plus(seed));
}

// Each entry returns `() => any` that performs one logical operation.
const SUITES = [
  // ---------- integer ----------
  {
    suite: 'integer',
    name: 'generate default (i32 range)',
    setup: () => {
      const arb = fc.integer();
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },
  {
    suite: 'integer',
    name: 'generate small range (0..100)',
    setup: () => {
      const arb = fc.integer({ min: 0, max: 100 });
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },
  {
    suite: 'integer',
    name: 'generate biased default',
    setup: () => {
      const arb = fc.integer();
      const rng = mkRng();
      return () => arb.generate(rng, 2);
    },
  },
  {
    suite: 'integer',
    name: 'generate signed (-100..100)',
    setup: () => {
      const arb = fc.integer({ min: -100, max: 100 });
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },
  {
    suite: 'integer',
    name: 'shrink default mid value',
    setup: () => {
      const arb = fc.integer();
      return () => {
        const stream = arb.shrink(123456, undefined);
        let n = 0;
        for (const v of stream) {
          if (++n >= 16) break;
          if (v === undefined) break;
        }
      };
    },
  },

  // ---------- nat ----------
  {
    suite: 'nat',
    name: 'generate default',
    setup: () => {
      const arb = fc.nat();
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },

  // ---------- boolean ----------
  {
    suite: 'boolean',
    name: 'generate',
    setup: () => {
      const arb = fc.boolean();
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },
  {
    suite: 'boolean',
    name: 'generate biased',
    setup: () => {
      const arb = fc.boolean();
      const rng = mkRng();
      return () => arb.generate(rng, 2);
    },
  },

  // ---------- constant ----------
  {
    suite: 'constant',
    name: 'generate single',
    setup: () => {
      const arb = fc.constant('hello');
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },
  {
    suite: 'constantFrom',
    name: 'generate 5 values',
    setup: () => {
      const arb = fc.constantFrom('a', 'b', 'c', 'd', 'e');
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },
  {
    suite: 'constantFrom',
    name: 'generate 100 values',
    setup: () => {
      const arr = Array.from({ length: 100 }, (_, i) => i);
      const arb = fc.constantFrom(...arr);
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },

  // ---------- tuple ----------
  {
    suite: 'tuple',
    name: 'generate (int, int)',
    setup: () => {
      const arb = fc.tuple(fc.integer(), fc.integer());
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },
  {
    suite: 'tuple',
    name: 'generate (int, bool, str)',
    setup: () => {
      const arb = fc.tuple(fc.integer({ min: 0, max: 100 }), fc.boolean(), fc.constantFrom('x', 'y'));
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },
  {
    suite: 'tuple',
    name: 'generate (5x int)',
    setup: () => {
      const arb = fc.tuple(fc.integer(), fc.integer(), fc.integer(), fc.integer(), fc.integer());
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },

  // ---------- array ----------
  {
    suite: 'array',
    name: 'generate array<int> default',
    setup: () => {
      const arb = fc.array(fc.integer());
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },
  {
    suite: 'array',
    name: 'generate array<int> small (max 10)',
    setup: () => {
      const arb = fc.array(fc.integer(), { maxLength: 10 });
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },
  {
    suite: 'array',
    name: 'generate array<int> fixed len 50',
    setup: () => {
      const arb = fc.array(fc.integer({ min: 0, max: 100 }), { minLength: 50, maxLength: 50 });
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },
  {
    suite: 'array',
    name: 'generate array<bool> default',
    setup: () => {
      const arb = fc.array(fc.boolean());
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },

  // ---------- string ----------
  {
    suite: 'string',
    name: 'generate default',
    setup: () => {
      const arb = fc.string();
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },
  {
    suite: 'string',
    name: 'generate short (max 10)',
    setup: () => {
      const arb = fc.string({ maxLength: 10 });
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },
  {
    suite: 'string',
    name: 'generate ascii fixed 50',
    setup: () => {
      const arb = fc.string({ unit: 'binary-ascii', minLength: 50, maxLength: 50 });
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },

  // ---------- oneof ----------
  {
    suite: 'oneof',
    name: 'generate 3-way (int,bool,str)',
    setup: () => {
      const arb = fc.oneof(fc.integer(), fc.boolean(), fc.constant('x'));
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },

  // ---------- record ----------
  {
    suite: 'record',
    name: 'generate small {a,b,c}',
    setup: () => {
      const arb = fc.record({ a: fc.integer({ min: 0, max: 100 }), b: fc.boolean(), c: fc.constantFrom('x', 'y') });
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },

  // ---------- mapToConstant ----------
  {
    suite: 'mapToConstant',
    name: 'generate ascii-ish 3 entries',
    setup: () => {
      const arb = fc.mapToConstant(
        { num: 26, build: (v) => String.fromCharCode(v + 0x61) },
        { num: 26, build: (v) => String.fromCharCode(v + 0x41) },
        { num: 10, build: (v) => String.fromCharCode(v + 0x30) },
      );
      const rng = mkRng();
      return () => arb.generate(rng, undefined);
    },
  },
];

export async function runAll({ quiet = false, filter } = {}) {
  const results = [];
  let currentSuite = '';
  for (const entry of SUITES) {
    if (filter && !filter(entry)) continue;
    if (!quiet && entry.suite !== currentSuite) {
      console.log(`# ${entry.suite}`);
      currentSuite = entry.suite;
    }
    const fn = entry.setup();
    const r = bench(entry.name, fn);
    r.suite = entry.suite;
    results.push(r);
    if (!quiet) printResult(r);
  }
  return results.map((r) => ({ suite: r.suite, name: r.name, median: r.median, mean: r.mean, min: r.min, max: r.max }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runAll();
}

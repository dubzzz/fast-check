const Benchmark = require('benchmark');
const fc = require('../lib/fast-check');

const benchSettings = function(label, arb) {
    (new Benchmark.Suite())
        .add(`[default] ${label}`, () => fc.sample(arb))
        .add(`[unbiased] ${label}`, () => fc.sample(arb, { unbiased: true }))
        .add(`[random:congruential] ${label}`, () => fc.sample(arb, { randomType: 'congruential' }))
        .add(`[random:congruential32] ${label}`, () => fc.sample(arb, { randomType: 'congruential32' }))
        .on('cycle', (event) => console.log(String(event.target)))
        .on('complete', function() { console.log(`Fastest is ${this.filter('fastest').map('name')}\n`); })
        .run({ async: false });
};

benchSettings('boolean', fc.boolean());
benchSettings('integer', fc.integer());
benchSettings('integer (min, max)', fc.integer(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER));
benchSettings('float', fc.float());
benchSettings('double', fc.double());
benchSettings('array', fc.array(fc.integer()));
benchSettings('array (min size)', fc.array(fc.integer(), 5, 10));
benchSettings('set', fc.set(fc.integer()));
benchSettings('set (min size)', fc.set(fc.integer(), 5, 10));
benchSettings('string', fc.string());
benchSettings('fullUnicodeString', fc.fullUnicodeString());
benchSettings('function', fc.func(fc.integer()));
benchSettings('record', fc.record({a: fc.integer()}));
benchSettings('record (optional keys)', fc.record({a: fc.integer()}, { withDeletedKeys: true }));
benchSettings('dictionary', fc.dictionary(fc.string(), fc.integer()));
benchSettings('object', fc.object());
benchSettings('anything', fc.anything());

(new Benchmark.Suite())
    .add('filter', () => fc.assert(fc.property(fc.nat(3).filter(i => i != 0), () => { return true; })))
    .add('pre', () => fc.assert(fc.property(fc.nat(3), (i) => { fc.pre(i != 0); return true; })))
    .on('cycle', (event) => console.log(String(event.target)))
    .on('complete', function() { console.log(`Fastest is ${this.filter('fastest').map('name')}\n`); })
    .run({ async: false });

(new Benchmark.Suite())
    .add('check', () => fc.assert(fc.property(fc.nat(3), () => { return true; })))
    .add('assert', () => fc.assert(fc.property(fc.nat(3), () => { return true; })))
    .add('sample', () => fc.sample(fc.property(fc.nat(3), () => { return true; })))
    .add('sample[arb]', () => fc.sample(fc.nat(3)))
    .on('cycle', (event) => console.log(String(event.target)))
    .on('complete', function() { console.log(`Fastest is ${this.filter('fastest').map('name')}\n`); })
    .run({ async: false });

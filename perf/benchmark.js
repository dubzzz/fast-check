const Benchmark = require('benchmark');
const fcOld = require('../lib-old/fast-check');
const fcNew = require('../lib/fast-check');

const { runComplexFailure, runArraySuccess } = require('./tasks');

const MIN_SAMPLES = 20;
const benchConf = { minSamples: MIN_SAMPLES };
const run = runArraySuccess;

Benchmark.invoke(
    [
      new Benchmark(`Reference`, () => run(fcOld), benchConf),
      new Benchmark(`Test`, () => run(fcNew), benchConf),
      new Benchmark(`Reference`, () => run(fcOld), benchConf),
      new Benchmark(`Test`, () => run(fcNew), benchConf),
    ], {
        name: 'run',
        queued: true,
        onCycle: (event) => console.log(String(event.target)),
    }
);

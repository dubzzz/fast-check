const Benchmark = require('benchmark');
const fcOld = require('../lib-old/fast-check');
const fcNew = require('fast-check');

const { runComplexFailure, runArraySuccess } = require('./tasks');

const MIN_SAMPLES = 1000;
const benchConf = { minSamples: MIN_SAMPLES };
const sampler = (fc, arb) => fc.sample(arb.noShrink());

const algos = [
  { name: 'run.complex', run: runComplexFailure },
  { name: 'run.array', run: runArraySuccess },
  { name: 'gen.array', run: (fc) => sampler(fc, fc.array(fc.constant('a'))) },
  { name: 'gen.stringOf', run: (fc) => sampler(fc, fc.stringOf(fc.constant('a'))) },
  { name: 'gen.string', run: (fc) => sampler(fc, fc.string()) },
  { name: 'gen.asciiString', run: (fc) => sampler(fc, fc.asciiString()) },
  { name: 'gen.string16bits', run: (fc) => sampler(fc, fc.string16bits()) },
  { name: 'gen.unicodeString', run: (fc) => sampler(fc, fc.unicodeString()) },
  { name: 'gen.fullUnicodeString', run: (fc) => sampler(fc, fc.fullUnicodeString()) },
  { name: 'gen.hexaString', run: (fc) => sampler(fc, fc.hexaString()) },
  { name: 'gen.base64String', run: (fc) => sampler(fc, fc.base64String()) },
  { name: 'gen.float', run: (fc) => sampler(fc, fc.float()) },
  { name: 'gen.double', run: (fc) => sampler(fc, fc.double()) },
];

for (const a of algos) {
  Benchmark.invoke(
    [
      new Benchmark(`Reference..${a.name}`, () => a.run(fcOld), benchConf),
      new Benchmark(`Test.......${a.name}`, () => a.run(fcNew), benchConf),
      new Benchmark(`Reference..${a.name}`, () => a.run(fcOld), benchConf),
      new Benchmark(`Test.......${a.name}`, () => a.run(fcNew), benchConf),
    ],
    {
      name: 'run',
      queued: true,
      onCycle: (event) => console.log(String(event.target)),
    }
  );
}

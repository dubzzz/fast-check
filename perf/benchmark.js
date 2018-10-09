const Benchmark = require('benchmark');
const fcOld = require('../lib-old/fast-check');
const fcNew = require('../lib/fast-check');

const MIN_SAMPLES = 20;
const benchConf = { minSamples: MIN_SAMPLES };

const run = function(fc) {
  let loremIpsum = fc.record({
    text: fc.lorem(100),
    type: fc.constant('x'),
    attrs: fc.constant({}),
    markup: fc.option(
      fc.array(
        fc.record({
          type: fc.oneof(fc.constant('b'), fc.constant('i'), fc.constant('u')),
          start: fc.nat(1),
          end: fc.nat(100)
        }),
        1,
        10
      )
    )
  });

  let section = n =>
    fc.record({
      heading: loremIpsum,
      children: fc.array(n > 0 ? fc.oneof(loremIpsum, loremIpsum, loremIpsum, section(n - 1)) : loremIpsum, 10)
    });

  fc.check(fc.property(section(5), s => !(s.children.length === 4 && s.children[0].text == null)), { seed: 42 });
};

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

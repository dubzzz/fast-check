exports.runComplexFailure = function (fc) {
  const loremIpsum = fc.record({
    text: fc.lorem({ maxCount: 100 }),
    type: fc.constant('x'),
    attrs: fc.constant({}),
    markup: fc.option(
      fc.array(
        fc.record({
          type: fc.oneof(fc.constant('b'), fc.constant('i'), fc.constant('u')),
          start: fc.nat(1),
          end: fc.nat(100),
        }),
        { minLength: 1 }
      )
    ),
  });

  const section = (n) =>
    fc.record({
      heading: loremIpsum,
      children: fc.array(n > 0 ? fc.oneof(loremIpsum, loremIpsum, loremIpsum, section(n - 1)) : loremIpsum),
    });

  fc.check(
    fc.property(section(5), (s) => !(s.children.length === 4 && s.children[0].text == null)),
    { seed: 42 }
  );
};

exports.runArraySuccess = function (fc) {
  fc.check(
    fc.property(fc.array(fc.nat()), (_) => true),
    { seed: 42 }
  );
};

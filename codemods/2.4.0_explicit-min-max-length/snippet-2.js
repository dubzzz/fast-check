import fc from 'fast-check';

test('test A', () => {
  fc.assert(fc.property(fc.array(fc.nat(), 7, 10), () => true));
});

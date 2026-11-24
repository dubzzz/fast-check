import * as fc from 'fast-check';

test('the name of my test', () => {
  fc.sample(fc.asyncProperty(fc.nat(), () => true));
});

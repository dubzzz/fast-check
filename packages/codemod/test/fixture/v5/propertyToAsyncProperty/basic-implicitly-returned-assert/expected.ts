import * as fc from 'fast-check';

test('the name of the test', () => fc.assert(fc.asyncProperty(fc.nat(), (n) => true)));

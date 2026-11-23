import * as fc from 'fast-check';

export const exportedProp = fc.property(fc.nat(), () => true);
const localProp = fc.asyncProperty(fc.nat(), () => true);
test('asserts the exported property', () => {
  fc.assert(exportedProp);
});
test('asserts the independent local property', async () => {
  await fc.assert(localProp);
});

import * as fc from 'fast-check';

for (const fc of [{ asyncProperty: () => 1 }]) {
  fc.asyncProperty();
}
fc.asyncProperty(fc.nat(), async () => true);

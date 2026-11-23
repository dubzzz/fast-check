import * as fc from 'fast-check';

for (const fc of [{ asyncProperty: () => 1 }]) {
  fc.asyncProperty();
}
fc.property(fc.nat(), async () => true);

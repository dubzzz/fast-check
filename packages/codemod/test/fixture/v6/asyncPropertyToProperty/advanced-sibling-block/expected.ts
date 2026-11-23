import * as fc from 'fast-check';

function run() {
  {
    const fc = { asyncProperty: () => 1 };
    fc.asyncProperty();
  }
  fc.property(fc.nat(), async () => true);
}

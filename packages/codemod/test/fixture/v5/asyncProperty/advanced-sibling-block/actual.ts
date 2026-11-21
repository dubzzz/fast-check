import * as fc from 'fast-check';

function run() {
  {
    const fc = { asyncProperty: () => 1 };
    fc.asyncProperty();
  }
  fc.asyncProperty(fc.nat(), async () => true);
}

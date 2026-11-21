import * as fc from 'fast-check';

function run(fc: { asyncProperty(): void }) {
  fc.asyncProperty();
}

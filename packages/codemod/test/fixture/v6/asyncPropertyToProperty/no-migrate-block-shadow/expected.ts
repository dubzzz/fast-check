import * as fc from 'fast-check';

{
  const fc = { asyncProperty: () => 1 };
  fc.asyncProperty();
}

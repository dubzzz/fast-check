import * as fc from 'fast-check';

fc.statistics(
  fc.property(fc.nat(), fc.string(), () => false),
  ([n, text]) => String(n + text.length),
);

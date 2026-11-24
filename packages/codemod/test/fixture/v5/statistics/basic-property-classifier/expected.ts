import * as fc from 'fast-check';

fc.logStatistics(await fc.statistics(
  fc.property(fc.nat(), fc.string(), () => false),
  (n, text) => String(n + text.length),
  {
    noPredicateExecution: true
  }
));

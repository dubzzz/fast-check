import * as fc from 'fast-check';

// This name could refer to a property, so its classifier and predicate need review.
fc.logStatistics(await fc.statistics(arbForProperty, classify));

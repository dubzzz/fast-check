import * as fc from 'fast-check';

// The name also mentions a property, so the predicate may need to be skipped.
fc.sample(arbForProperty);

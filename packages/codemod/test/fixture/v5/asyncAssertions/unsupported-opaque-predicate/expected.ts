import * as fc from 'fast-check';

import { predicate } from './predicates.js';

// The imported predicate may return a promise.
fc.assert(fc.property(fc.nat(), predicate));

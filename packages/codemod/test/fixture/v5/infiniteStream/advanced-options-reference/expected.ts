import * as fc from 'fast-check';

// A shared options object can contain other iterator constraints.
fc.infiniteStream(fc.integer(), options);

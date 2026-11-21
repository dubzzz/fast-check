import * as fc from 'fast-check';

// A dynamic flag requires choosing how the reporter is configured at runtime.
fc.assert(prop, { includeErrorInReport: enabled });

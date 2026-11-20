import * as fc from 'fast-check';

fc.infiniteStream(fc.string(), { noHistory: true });

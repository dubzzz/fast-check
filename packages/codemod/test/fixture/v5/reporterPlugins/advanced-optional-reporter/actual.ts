import { assert, integer, property, type RunDetails } from 'fast-check';

declare function chooseReporter(): ((details: RunDetails<[number]>) => void) | undefined;
let reporterCallback = chooseReporter();
const assessment = assert(property(integer(), Number.isInteger), { reporter: reporterCallback });
reporterCallback = undefined;
await assessment;

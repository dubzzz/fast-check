import * as fc from 'fast-check';

fc.configureGlobal({ ...fc.readConfigureGlobal(), numRuns: 20, timeout: 10 });

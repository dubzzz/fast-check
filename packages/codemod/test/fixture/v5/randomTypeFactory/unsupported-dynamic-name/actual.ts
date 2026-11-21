import * as fc from 'fast-check';

// The factory depends on a runtime choice, so no single import can replace it.
fc.configureGlobal({ randomType: readGeneratorName() });

import * as fc from 'fast-check';

const randomType = readGeneratorName();
fc.configureGlobal({ randomType });

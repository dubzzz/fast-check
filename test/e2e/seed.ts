import * as fc from '../../lib/fast-check';

const globalConfig = fc.readConfigureGlobal() || {};
const globalSeed = globalConfig.seed;

export const seed = globalSeed !== undefined ? globalSeed : Date.now();

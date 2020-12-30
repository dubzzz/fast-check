import * as fc from '../../lib/fast-check';

const globalConfig = fc.readGlobalConfiguration() || {};
const globalSeed = globalConfig.seed;

export const seed = globalSeed !== undefined ? globalSeed : Date.now();

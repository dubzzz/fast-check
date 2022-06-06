import * as process from 'process';
import * as fc from 'fast-check';

const globalConfig = fc.readConfigureGlobal() || {};
const globalSeed = globalConfig.seed;

if (process.env.CI && globalSeed === undefined) {
  throw new Error('seed must be defined globally in CI');
}
export const seed = globalSeed !== undefined ? globalSeed : Date.now();

// @ts-check
import fc from 'fast-check';
import { propertyFor } from '@fast-check/worker';

const counters = {};
function buildPropertyWarmUp(isolationLevel) {
  return propertyFor(new URL(import.meta.url), { isolationLevel })(
    fc.integer({ min: -1000, max: 1000 }),
    fc.integer({ min: -1000, max: 1000 }),
    (_from, _to) => {
      if (counters[isolationLevel] !== undefined && counters[isolationLevel] !== 'warm-up') {
        throw new Error(`Broken isolation, got: ${counters[isolationLevel]}, for isolation level: ${isolationLevel}`);
      }
      counters[isolationLevel] = 'warm-up';
    },
  );
}
function buildPropertyRun(isolationLevel) {
  return propertyFor(new URL(import.meta.url), { isolationLevel })(
    fc.integer({ min: -1000, max: 1000 }),
    fc.integer({ min: -1000, max: 1000 }),
    (_from, _to) => {
      if (counters[isolationLevel] !== undefined && counters[isolationLevel] !== 'run') {
        throw new Error(`Broken isolation, got: ${counters[isolationLevel]}, for isolation level: ${isolationLevel}`);
      }
      counters[isolationLevel] = 'run';
    },
  );
}

export const propertyIsolation = {
  predicateLevelWarmUp: buildPropertyWarmUp('predicate'),
  predicateLevelRun: buildPropertyRun('predicate'),
  propertyLevelWarmUp: buildPropertyWarmUp('property'),
  propertyLevelRun: buildPropertyRun('property'),
  fileLevelWarmUp: buildPropertyWarmUp('file'),
  fileLevelRun: buildPropertyRun('file'),
};

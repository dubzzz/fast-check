// @ts-check
const { pathToFileURL } = require('node:url');
const fc = require('fast-check');
const { propertyFor } = require('@fast-check/worker');

const counters = {};
function buildPropertyWarmUp(isolationLevel) {
  return propertyFor(pathToFileURL(__filename), { isolationLevel })(
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
  return propertyFor(pathToFileURL(__filename), { isolationLevel })(
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

exports.propertyIsolation = {
  predicateLevelWarmUp: buildPropertyWarmUp('predicate'),
  predicateLevelRun: buildPropertyRun('predicate'),
  propertyLevelWarmUp: buildPropertyWarmUp('property'),
  propertyLevelRun: buildPropertyRun('property'),
  fileLevelWarmUp: buildPropertyWarmUp('file'),
  fileLevelRun: buildPropertyRun('file'),
};

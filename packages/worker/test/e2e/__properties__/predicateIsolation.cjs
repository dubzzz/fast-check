// @ts-check
const process = require('node:process');
const { pathToFileURL } = require('node:url');
const fc = require('fast-check');
const { propertyFor } = require('@fast-check/worker');

const counters = {};
function buildProperty(isolationLevel, forceExit) {
  return propertyFor(pathToFileURL(__filename), { isolationLevel })(
    fc.integer({ min: -1000, max: 1000 }),
    fc.integer({ min: -1000, max: 1000 }),
    (_from, _to) => {
      if (isolationLevel in counters) {
        if (forceExit) {
          process.exit(1);
        } else {
          throw new Error(`Encounter counters: ${Object.keys(counters)}, for isolation level: ${isolationLevel}`);
        }
      }
      counters[isolationLevel] = true;
    },
  );
}

exports.predicateIsolation = {
  predicateLevel: buildProperty('predicate', false),
  propertyLevel: buildProperty('property', false),
  propertyLevelDepthCheckWithExitWorker: buildProperty('propertyLevelDepthCheckWithExitWorker', true),
  propertyLevelDepthCheckWithThrow: buildProperty('propertyLevelDepthCheckWithThrow', false),
  fileLevel: buildProperty('file', false),
};

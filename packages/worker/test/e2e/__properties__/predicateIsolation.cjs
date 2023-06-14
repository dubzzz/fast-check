// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
/* global __filename, exports, require */
const { pathToFileURL } = require('node:url');
const fc = require('fast-check');
const { propertyFor } = require('@fast-check/worker');

const counters = {};
function buildProperty(isolationLevel) {
  return propertyFor(pathToFileURL(__filename), { isolationLevel })(
    fc.integer({ min: -1000, max: 1000 }),
    fc.integer({ min: -1000, max: 1000 }),
    (_from, _to) => {
      if (isolationLevel in counters) {
        throw new Error(`Encounter counters: ${Object.keys(counters)}, for isolation level: ${isolationLevel}`);
      }
      counters[isolationLevel] = true;
    }
  );
}

exports.predicateIsolation = {
  predicateLevel: buildProperty('predicate'),
  propertyLevel: buildProperty('property'),
  fileLevel: buildProperty('file'),
};

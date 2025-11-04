// @ts-check
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import fc from 'fast-check';
import { propertyFor } from '@fast-check/worker';

const __filename = fileURLToPath(import.meta.url);

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

export const predicateIsolation = {
  predicateLevel: buildProperty('predicate', false),
  propertyLevel: buildProperty('property', false),
  propertyLevelDepthCheckWithExitWorker: buildProperty('propertyLevelDepthCheckWithExitWorker', true),
  propertyLevelDepthCheckWithThrow: buildProperty('propertyLevelDepthCheckWithThrow', false),
  fileLevel: buildProperty('file', false),
};

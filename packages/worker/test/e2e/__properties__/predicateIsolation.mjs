// @ts-check
import fc from 'fast-check';
import { propertyFor } from '@fast-check/worker';

const counters = {};
function buildProperty(isolationLevel) {
  return propertyFor(new URL(import.meta.url), { isolationLevel })(
    fc.integer({ min: -1000, max: 1000 }),
    fc.integer({ min: -1000, max: 1000 }),
    (_from, _to) => {
      if (isolationLevel in counters) {
        throw new Error(`Encounter counters: ${Object.keys(counters)}, for isolation level: ${isolationLevel}`);
      }
      counters[isolationLevel] = true;
    },
  );
}

export const predicateIsolation = {
  predicateLevel: buildProperty('predicate'),
  propertyLevel: buildProperty('property'),
  fileLevel: buildProperty('file'),
};

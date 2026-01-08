// @ts-check
import { pathToFileURL } from 'node:url';
import fc from 'fast-check';
import { propertyFor } from '@fast-check/worker';

const __filename = import.meta.filename;
const property = propertyFor(pathToFileURL(__filename), { randomSource: 'worker' });

export const nonSerializableButSameDataProperty = property(
  fc.integer({ min: -1000, max: 1000 }).map((v) => Symbol.for(String(v))),
  (symbol) => {
    if (fc.stringify(symbol).includes('0')) {
      throw new Error(`>>>nonSerializableButSameDataProperty=${fc.stringify(symbol)}<<<`);
    }
  },
);

export const nonSerializableButSameDataRawProperty = fc.property(
  fc.integer({ min: -1000, max: 1000 }).map((v) => Symbol.for(String(v))),
  (symbol) => {
    if (fc.stringify(symbol).includes('0')) {
      throw new Error(`>>>nonSerializableButSameDataProperty=${fc.stringify(symbol)}<<<`);
    }
  },
);

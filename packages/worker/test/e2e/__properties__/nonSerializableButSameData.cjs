// @ts-check
const { pathToFileURL } = require('node:url');
const fc = require('fast-check');
const { propertyFor } = require('@fast-check/worker');

const property = propertyFor(pathToFileURL(__filename), { randomSource: 'worker' });

exports.nonSerializableButSameDataProperty = property(
  fc.integer({ min: -1000, max: 1000 }).map((v) => Symbol.for(String(v))),
  (symbol) => {
    if (fc.stringify(symbol).includes('0')) {
      throw new Error(`>>>nonSerializableButSameDataProperty=${fc.stringify(symbol)}<<<`);
    }
  },
);

exports.nonSerializableButSameDataRawProperty = fc.property(
  fc.integer({ min: -1000, max: 1000 }).map((v) => Symbol.for(String(v))),
  (symbol) => {
    if (fc.stringify(symbol).includes('0')) {
      throw new Error(`>>>nonSerializableButSameDataProperty=${fc.stringify(symbol)}<<<`);
    }
  },
);

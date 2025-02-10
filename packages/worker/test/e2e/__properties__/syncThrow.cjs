// @ts-check
const { pathToFileURL } = require('node:url');
const fc = require('fast-check');
const { propertyFor } = require('@fast-check/worker');

const property = propertyFor(pathToFileURL(__filename));

exports.syncThrowProperty = property(
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  (from, to) => {
    if (Math.abs(from - to) >= 100) {
      throw new Error('Out of range, synchronously');
    }
  },
);

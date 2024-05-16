// @ts-check
const { pathToFileURL } = require('node:url');
const fc = require('fast-check');
const { propertyFor } = require('@fast-check/worker');

const property = propertyFor(pathToFileURL(__filename));

exports.asyncThrowProperty = property(
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  async (from, to) => {
    await Promise.resolve();
    if (Math.abs(from - to) >= 100) {
      throw new Error('Out of range, asynchronously'); // Throwing after an await
    }
  },
);

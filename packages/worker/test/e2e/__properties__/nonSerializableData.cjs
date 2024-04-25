// @ts-check
const { pathToFileURL } = require('node:url');
const fc = require('fast-check');
const { propertyFor } = require('@fast-check/worker');

const property = propertyFor(pathToFileURL(__filename), { randomSource: 'worker' });
const propertyMainThread = propertyFor(pathToFileURL(__filename), { randomSource: 'main-thread' });

exports.nonSerializableDataProperty = property(
  fc.integer({ min: -1000, max: 1000 }).map((v) => Symbol.for(String(v))),
  (symbol) => typeof symbol === 'symbol',
);

exports.nonSerializableDataPropertyMainThread = propertyMainThread(
  fc.integer({ min: -1000, max: 1000 }).map((v) => Symbol.for(String(v))),
  (symbol) => typeof symbol === 'symbol',
);

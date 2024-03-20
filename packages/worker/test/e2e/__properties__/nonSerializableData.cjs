// @ts-check
/* eslint-disable @typescript-eslint/no-var-requires */
/* global __filename, exports, require */
const { pathToFileURL } = require('node:url');
const fc = require('fast-check');
const { propertyFor } = require('@fast-check/worker');

const property = propertyFor(pathToFileURL(__filename), { randomSource: 'worker' });

exports.nonSerializableDataProperty = property(
  fc.integer({ min: -1000, max: 1000 }).map((v) => Symbol.for(String(v))),
  (symbol) => typeof symbol === 'symbol',
);

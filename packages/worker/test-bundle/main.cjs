const { pathToFileURL } = require('node:url');
const { constant } = require('fast-check');
const { propertyFor, assert } = require('@fast-check/worker');

const property = propertyFor(pathToFileURL(__filename));
assert(property(constant(null), (data) => Object.is(data, null)));

const { pathToFileURL } = require('node:url');
const fc = require('fast-check');
const { workerProperty } = require('@fast-check/worker');

const workerFileUrl = pathToFileURL(__filename);

exports.blockEventLoopProperty = workerProperty(
  workerFileUrl,
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  (from, to) => {
    for (let i = from; i !== to; ++i) {
      // Loop from "from" to "to" possibly NEVER ending
    }
  }
);

exports.passingProperty = workerProperty(
  workerFileUrl,
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  (from, to) => {
    for (let i = from; i <= to; ++i) {
      // Loop from "from" to "to" ALWAYS finite
    }
  }
);

exports.failingProperty = workerProperty(
  workerFileUrl,
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  (_from, _to) => {
    throw new Error("I'm a failing property");
  }
);

exports.buildUnregisteredProperty = () =>
  workerProperty(
    workerFileUrl,
    fc.integer({ min: -1000, max: 1000 }),
    fc.integer({ min: -1000, max: 1000 }),
    (_from, _to) => {
      return true; // success
    }
  );

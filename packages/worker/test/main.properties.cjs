const { pathToFileURL } = require('node:url');
const fc = require('fast-check');
const { propertyFor } = require('@fast-check/worker');

const property = propertyFor(pathToFileURL(__filename));

exports.blockEventLoopProperty = property(
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  (from, to) => {
    for (let i = from; i !== to; ++i) {
      // Loop from "from" to "to" possibly NEVER ending
    }
  }
);

exports.passingProperty = property(
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  (from, to) => {
    for (let i = from; i <= to; ++i) {
      // Loop from "from" to "to" ALWAYS finite
    }
  }
);

exports.failingProperty = property(
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  (_from, _to) => {
    throw new Error("I'm a failing property");
  }
);

exports.buildUnregisteredProperty = () =>
  property(fc.integer({ min: -1000, max: 1000 }), fc.integer({ min: -1000, max: 1000 }), (_from, _to) => {
    return true; // success
  });

let counterIsolatedAtPredicate = 0;
exports.passingPropertyAsIsolatedAtPredicate = propertyFor(pathToFileURL(__filename), { isolationLevel: 'predicate' })(
  fc.integer({ min: -1000, max: 1000 }),
  (_from, _to) => {
    if (counterIsolatedAtPredicate !== 0) {
      throw new Error(`Encounter counter different from 0, got: ${counterIsolatedAtPredicate}`);
    }
    counterIsolatedAtPredicate += 1;
  }
);

let counterIsolatedAtProperty = 0;
exports.failingPropertyAsNotEnoughIsolated = propertyFor(pathToFileURL(__filename), { isolationLevel: 'property' })(
  fc.integer({ min: -1000, max: 1000 }),
  (_from, _to) => {
    if (counterIsolatedAtProperty !== 0) {
      throw new Error(`Encounter counter different from 0, got: ${counterIsolatedAtProperty}`);
    }
    counterIsolatedAtProperty += 1;
  }
);

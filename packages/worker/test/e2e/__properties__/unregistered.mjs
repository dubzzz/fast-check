// @ts-check
import fc from 'fast-check';
import { propertyFor } from '@fast-check/worker';

const property = propertyFor(new URL(import.meta.url));

exports.buildUnregisteredProperty = () =>
  property(fc.integer({ min: -1000, max: 1000 }), fc.integer({ min: -1000, max: 1000 }), (_from, _to) => {
    return true; // success
  });

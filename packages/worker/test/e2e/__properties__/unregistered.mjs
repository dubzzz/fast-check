// @ts-check
import { pathToFileURL, fileURLToPath } from 'node:url';
import fc from 'fast-check';
import { propertyFor } from '@fast-check/worker';

const __filename = fileURLToPath(import.meta.url);
const property = propertyFor(pathToFileURL(__filename));

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const buildUnregisteredProperty = () =>
  property(fc.integer({ min: -1000, max: 1000 }), fc.integer({ min: -1000, max: 1000 }), (_from, _to) => {
    return true; // success
  });

// @ts-check
import { pathToFileURL, fileURLToPath } from 'node:url';
import fc from 'fast-check';
import { propertyFor } from '@fast-check/worker';

const __filename = fileURLToPath(import.meta.url);
const property = propertyFor(pathToFileURL(__filename));

export const syncThrowProperty = property(
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  (from, to) => {
    if (Math.abs(from - to) >= 100) {
      throw new Error('Out of range, synchronously');
    }
  },
);

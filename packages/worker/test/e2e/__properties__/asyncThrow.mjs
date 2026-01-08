// @ts-check
import { pathToFileURL } from 'node:url';
import fc from 'fast-check';
import { propertyFor } from '@fast-check/worker';

const __filename = import.meta.filename;
const property = propertyFor(pathToFileURL(__filename));

export const asyncThrowProperty = property(
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  async (from, to) => {
    await Promise.resolve();
    if (Math.abs(from - to) >= 100) {
      throw new Error('Out of range, asynchronously'); // Throwing after an await
    }
  },
);

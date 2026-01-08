// @ts-check
import { pathToFileURL } from 'node:url';
import fc from 'fast-check';
import { propertyFor } from '@fast-check/worker';

const __filename = import.meta.filename;
const property = propertyFor(pathToFileURL(__filename));

export const supportPreProperty = property(
  fc.integer({ min: -1000, max: 1000 }),
  fc.integer({ min: -1000, max: 1000 }),
  (from, to) => {
    fc.pre(from < to);
    if (from >= to) {
      throw new Error('Oups');
    }
  },
);

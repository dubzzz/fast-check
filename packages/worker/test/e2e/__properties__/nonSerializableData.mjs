// @ts-check
import { pathToFileURL } from 'node:url';
import fc from 'fast-check';
import { propertyFor } from '@fast-check/worker';

const property = propertyFor(pathToFileURL(import.meta.filename), { randomSource: 'worker' });
const propertyMainThread = propertyFor(pathToFileURL(import.meta.filename), { randomSource: 'main-thread' });

export const nonSerializableDataProperty = property(
  fc.integer({ min: -1000, max: 1000 }).map((v) => Symbol.for(String(v))),
  (symbol) => typeof symbol === 'symbol',
);

export const nonSerializableDataPropertyMainThread = propertyMainThread(
  fc.integer({ min: -1000, max: 1000 }).map((v) => Symbol.for(String(v))),
  (symbol) => typeof symbol === 'symbol',
);

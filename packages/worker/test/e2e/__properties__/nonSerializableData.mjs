// @ts-check
import fc from 'fast-check';
import { propertyFor } from '@fast-check/worker';

const property = propertyFor(new URL(import.meta.url), { randomSource: 'worker' });
const propertyMainThread = propertyFor(new URL(import.meta.url), { randomSource: 'main-thread' });

exports.nonSerializableDataProperty = property(
  fc.integer({ min: -1000, max: 1000 }).map((v) => Symbol.for(String(v))),
  (symbol) => typeof symbol === 'symbol',
);

exports.nonSerializableDataPropertyMainThread = propertyMainThread(
  fc.integer({ min: -1000, max: 1000 }).map((v) => Symbol.for(String(v))),
  (symbol) => typeof symbol === 'symbol',
);

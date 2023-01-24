import { constant } from 'fast-check';
import { propertyFor, assert } from '@fast-check/worker';

const property = propertyFor(new URL(import.meta.url));
assert(property(constant(null), (data) => Object.is(data, null)));

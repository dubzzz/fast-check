import * as fc from 'fast-check';
import { test } from '@fast-check/jest';

// Also accept arbitraries imported directly from fast-check in both module systems.
test.prop([fc.string()])('should accept external arbitraries', (value) => value.length >= 0);

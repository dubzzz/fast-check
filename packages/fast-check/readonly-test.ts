import type { Arbitrary } from '../src/check/arbitrary/definition/Arbitrary';
import type { ObjectConstraints } from '../src/arbitrary/_internals/helpers/QualifiedObjectConstraints';
import type { OptionConstraints } from '../src/arbitrary/option';
import { object } from '../src/arbitrary/object';
import { option } from '../src/arbitrary/option';
import { boolean } from '../src/arbitrary/boolean';
import { integer } from '../src/arbitrary/integer';

// Test case 1: readonly array should be accepted for ObjectConstraints.values
const readonlyValues: readonly Arbitrary<unknown>[] = [boolean(), integer()];
const readonlyObjectConstraints: ObjectConstraints = {
  values: readonlyValues, // This might cause a TypeScript error if readonly not supported
};

// This should work but might cause issues currently
const testArb1 = object(readonlyObjectConstraints);

// Test case 2: readonly OptionConstraints  
const readonlyOptionConstraints: OptionConstraints = {
  freq: 5,
  nil: null,
} as const;

// This should work 
const testArb2 = option(integer(), readonlyOptionConstraints);

console.log('Tests compiled successfully!');
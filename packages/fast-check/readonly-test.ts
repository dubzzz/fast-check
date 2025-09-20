import type { Arbitrary } from './src/check/arbitrary/definition/Arbitrary';
import type { ObjectConstraints } from './src/arbitrary/_internals/helpers/QualifiedObjectConstraints';
import type { OptionConstraints } from './src/arbitrary/option';
import type { WebUrlConstraints } from './src/arbitrary/webUrl';
import type { ArrayConstraintsInternal } from './src/arbitrary/array';

// Test case 1: readonly array should be accepted for ObjectConstraints.values
const readonlyValues: readonly Arbitrary<unknown>[] = [] as readonly Arbitrary<unknown>[];
const readonlyObjectConstraints: ObjectConstraints = {
  values: readonlyValues, // This should work now
};

// Test case 2: readonly OptionConstraints  
const readonlyOptionConstraints: OptionConstraints = {
  freq: 5,
  nil: null,
} as const;

// Test case 3: readonly validSchemes for WebUrlConstraints
const readonlySchemes: readonly string[] = ['http', 'https'] as const;
const readonlyWebUrlConstraints: WebUrlConstraints = {
  validSchemes: readonlySchemes, // This should work now
};

// Test case 4: readonly experimentalCustomSlices for ArrayConstraintsInternal
const readonlySlices: readonly (readonly number[])[] = [[1, 2], [3, 4]] as const;
const readonlyArrayConstraints: ArrayConstraintsInternal<number> = {
  experimentalCustomSlices: readonlySlices, // This should work now
};

console.log('All readonly constraint tests passed!');
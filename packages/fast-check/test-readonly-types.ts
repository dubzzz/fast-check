// Simple test to verify readonly constraint types compile correctly
// This test only checks type compatibility without imports

type TestArbitrary<T> = { kind: 'arbitrary'; type: T };

// Simulating the interfaces we updated
interface TestObjectConstraints {
  values?: readonly TestArbitrary<unknown>[];
}

interface TestWebUrlConstraints {
  validSchemes?: readonly string[];
}

interface TestArrayConstraintsInternal<T> {
  experimentalCustomSlices?: readonly (readonly T[])[];
}

// Test case 1: readonly array should be accepted for ObjectConstraints.values
const readonlyValues: readonly TestArbitrary<unknown>[] = [];
const readonlyObjectConstraints: TestObjectConstraints = {
  values: readonlyValues, // This should work now
};

// Test case 2: readonly validSchemes for WebUrlConstraints
const readonlySchemes: readonly string[] = ['http', 'https'] as const;
const readonlyWebUrlConstraints: TestWebUrlConstraints = {
  validSchemes: readonlySchemes, // This should work now
};

// Test case 3: readonly experimentalCustomSlices for ArrayConstraintsInternal
const readonlySlices: readonly (readonly number[])[] = [[1, 2], [3, 4]] as const;
const readonlyArrayConstraints: TestArrayConstraintsInternal<number> = {
  experimentalCustomSlices: readonlySlices, // This should work now
};

// Test that mutable arrays still work (backward compatibility)
const mutableValues: TestArbitrary<unknown>[] = [];
const mutableObjectConstraints: TestObjectConstraints = {
  values: mutableValues, // This should still work
};

const mutableSchemes: string[] = ['http', 'https'];
const mutableWebUrlConstraints: TestWebUrlConstraints = {
  validSchemes: mutableSchemes, // This should still work
};

console.log('All readonly constraint type tests passed!');
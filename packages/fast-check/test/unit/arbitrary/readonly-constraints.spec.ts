/**
 * Test to verify readonly constraint annotations work correctly
 * This demonstrates that users can now pass readonly arrays and objects as constraints
 */
import { describe, it, expect } from 'vitest';
import { object } from '../../../src/arbitrary/object';
import { webUrl } from '../../../src/arbitrary/webUrl';
import { boolean } from '../../../src/arbitrary/boolean';
import { integer } from '../../../src/arbitrary/integer';

describe('Readonly constraint support', () => {
  it('should accept readonly arrays for ObjectConstraints.values', () => {
    const readonlyValues = [boolean(), integer()] as const;
    
    // This should compile and work without errors
    const objectArb = object({
      values: readonlyValues,
    });
    
    // Verify it generates values
    const value = objectArb.generate({
      nextInt: () => 0,
      nextBigInt: () => 0n,
      nextDouble: () => 0.5,
    }, undefined);
    
    expect(typeof value.value_).toBe('object');
  });

  it('should accept readonly string arrays for WebUrlConstraints.validSchemes', () => {
    const readonlySchemes = ['http', 'https'] as const;
    
    // This should compile and work without errors
    const urlArb = webUrl({
      validSchemes: readonlySchemes,
    });
    
    // Verify it generates values
    const value = urlArb.generate({
      nextInt: () => 0,
      nextBigInt: () => 0n,
      nextDouble: () => 0.5,
    }, undefined);
    
    expect(typeof value.value_).toBe('string');
    expect(value.value_).toMatch(/^https?:\/\//);
  });

  it('should maintain backward compatibility with mutable arrays', () => {
    // Test that mutable arrays still work
    const mutableValues = [boolean(), integer()];
    const mutableSchemes = ['http', 'https'];
    
    const objectArb = object({ values: mutableValues });
    const urlArb = webUrl({ validSchemes: mutableSchemes });
    
    expect(objectArb).toBeDefined();
    expect(urlArb).toBeDefined();
  });
});
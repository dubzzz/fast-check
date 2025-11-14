import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

describe('filter rejection mechanism - solution verification', () => {
  it('should prevent infinite loops by throwing PreconditionFailure after 100 attempts', () => {
    // This test verifies that filter now connects to rejection mechanisms like fc.pre
    
    // Before the fix: this would loop forever
    // After the fix: this should throw PreconditionFailure quickly
    const impossibleFilter = fc.integer({ min: 1, max: 10 }).filter(x => x > 20);
    
    const startTime = Date.now();
    let threwExpectedError = false;
    
    try {
      // Try to create a property - this should throw during value generation
      const property = fc.property(impossibleFilter, (x) => true);
      // This should not complete without throwing
      fc.check(property, { numRuns: 1 });
    } catch (error) {
      // Should throw a PreconditionFailure (same as fc.pre)
      const isPreconditionFailure = error && 
        typeof error === 'object' && 
        error.constructor.name === 'PreconditionFailure';
      threwExpectedError = isPreconditionFailure;
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete quickly (not loop forever)
    expect(duration).toBeLessThan(1000); // Should be very fast
    
    // Should throw the expected PreconditionFailure
    expect(threwExpectedError).toBe(true);
  });
  
  it('should still work efficiently with reasonable filters', () => {
    // Verify that the fix doesn't break normal filter usage
    const reasonableFilter = fc.integer({ min: 1, max: 100 }).filter(x => x % 2 === 0);
    
    const property = fc.property(reasonableFilter, (x) => {
      expect(x % 2).toBe(0); // should always be even
      return true;
    });
    
    const result = fc.check(property, { numRuns: 50 });
    expect(result.failed).toBe(false);
    expect(result.numRuns).toBe(50);
    // Should not skip too many values for a reasonable filter
    expect(result.numSkips).toBeLessThan(500);
  });
});
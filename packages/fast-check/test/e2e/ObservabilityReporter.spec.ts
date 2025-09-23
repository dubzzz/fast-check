import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fc from '../../src/fast-check';
import { seed } from './seed';
import * as fs from 'fs';
import * as path from 'path';

describe(`ObservabilityReporter (seed: ${seed})`, () => {
  const observerDir = path.join(process.cwd(), '.fast-check', 'observer');

  beforeEach(() => {
    // Clean up any existing observer files
    if (fs.existsSync(observerDir)) {
      const files = fs.readdirSync(observerDir);
      files.forEach((file) => {
        if (file.endsWith('_test_cases.jsonl')) {
          fs.unlinkSync(path.join(observerDir, file));
        }
      });
    }
    fc.resetConfigureGlobal();
  });

  afterEach(() => {
    fc.resetConfigureGlobal();
    // Clean up observer files after each test
    if (fs.existsSync(observerDir)) {
      const files = fs.readdirSync(observerDir);
      files.forEach((file) => {
        if (file.endsWith('_test_cases.jsonl')) {
          fs.unlinkSync(path.join(observerDir, file));
        }
      });
    }
  });

  it('should generate observability data for successful property tests', () => {
    fc.configureGlobal({ observabilityEnabled: true });

    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        // Commutative property of addition
        return a + b === b + a;
      }),
      {
        numRuns: 10,
        seed,
        testCaseName: 'commutative_addition_test',
      },
    );

    // Check that observability data was generated
    expect(fs.existsSync(observerDir)).toBe(true);
    const files = fs.readdirSync(observerDir);
    const jsonlFiles = files.filter((f) => f.endsWith('_test_cases.jsonl'));
    expect(jsonlFiles.length).toBeGreaterThan(0);

    // Read and validate the content
    const content = fs.readFileSync(path.join(observerDir, jsonlFiles[0]), 'utf8');
    const lines = content.trim().split('\n');
    expect(lines.length).toBeGreaterThan(0);

    // Validate each line is valid JSON with expected structure
    lines.forEach((line) => {
      const testCase = JSON.parse(line);
      expect(testCase).toMatchObject({
        type: 'test_case',
        run_start: expect.any(Number),
        property: 'commutative_addition_test',
        status: 'passed',
        status_reason: '',
        representation: expect.any(String),
        features: {},
        coverage: 'no_coverage_info',
        how_generated: 'fast-check',
      });
    });
  });

  it('should generate observability data for failing property tests with shrinking', () => {
    fc.configureGlobal({ observabilityEnabled: true });

    const result = fc.check(
      fc.property(fc.array(fc.integer({ min: 1, max: 100 })), (arr) => {
        fc.pre(arr.length > 0); // Ensure non-empty array
        return arr[0] > 50; // This will fail for values <= 50
      }),
      {
        numRuns: 100,
        seed,
        testCaseName: 'array_first_element_test',
      },
    );

    expect(result.failed).toBe(true);

    // Check that observability data was generated
    console.log(observerDir);

    expect(fs.existsSync(observerDir)).toBe(true);
    const files = fs.readdirSync(observerDir);
    console.log(files);
    const jsonlFiles = files.filter((f) => f.endsWith('_test_cases.jsonl'));
    expect(jsonlFiles.length).toBeGreaterThan(0);

    // Read and validate the content
    const content = fs.readFileSync(path.join(observerDir, jsonlFiles[0]), 'utf8');
    const lines = content.trim().split('\n');
    expect(lines.length).toBeGreaterThan(0);

    // Should have both passed and failed test cases
    const testCases = lines.map((line) => JSON.parse(line));
    const passedCases = testCases.filter((tc) => tc.status === 'passed');
    const failedCases = testCases.filter((tc) => tc.status === 'failed');
    const skippedCases = testCases.filter((tc) => tc.status === 'gave_up');

    expect(passedCases.length + failedCases.length + skippedCases.length).toBe(testCases.length);
    expect(failedCases.length).toBeGreaterThan(0); // Should have at least one failure

    // Validate structure of failed cases
    failedCases.forEach((testCase) => {
      expect(testCase).toMatchObject({
        type: 'test_case',
        run_start: expect.any(Number),
        property: 'array_first_element_test',
        status: 'failed',
        status_reason: expect.any(String),
        representation: expect.any(String),
        features: {},
        coverage: 'no_coverage_info',
        how_generated: 'fast-check',
      });
    });
  });

  it('should generate observability data for tests with pre-conditions', () => {
    fc.configureGlobal({ observabilityEnabled: true });

    fc.assert(
      fc.property(fc.integer({ min: 1, max: 100 }), fc.integer({ min: 1, max: 100 }), (a, b) => {
        fc.pre(a > 50 && b > 50); // Only test with values > 50
        return a * b > 2500; // Should always be true given the pre-condition
      }),
      {
        numRuns: 50,
        seed,
        testCaseName: 'multiplication_with_precondition_test',
      },
    );

    // Check that observability data was generated
    expect(fs.existsSync(observerDir)).toBe(true);
    const files = fs.readdirSync(observerDir);
    const jsonlFiles = files.filter((f) => f.endsWith('_test_cases.jsonl'));
    expect(jsonlFiles.length).toBeGreaterThan(0);

    // Read and validate the content
    const content = fs.readFileSync(path.join(observerDir, jsonlFiles[0]), 'utf8');
    const lines = content.trim().split('\n');
    expect(lines.length).toBeGreaterThan(0);

    const testCases = lines.map((line) => JSON.parse(line));
    const passedCases = testCases.filter((tc) => tc.status === 'passed');
    const skippedCases = testCases.filter((tc) => tc.status === 'gave_up');

    // Should have both passed and skipped cases due to pre-conditions
    expect(passedCases.length).toBeGreaterThan(0);
    expect(skippedCases.length).toBeGreaterThan(0);

    // Validate skipped cases have correct status reason
    skippedCases.forEach((testCase) => {
      expect(testCase).toMatchObject({
        type: 'test_case',
        run_start: expect.any(Number),
        property: 'multiplication_with_precondition_test',
        status: 'gave_up',
        status_reason: 'Pre-condition failed',
        representation: expect.any(String),
        features: {},
        coverage: 'no_coverage_info',
        how_generated: 'fast-check',
      });
    });
  });

  it('should generate observability data for complex object properties', () => {
    fc.configureGlobal({ observabilityEnabled: true });

    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 20 }),
          age: fc.integer({ min: 0, max: 120 }),
          active: fc.boolean(),
          scores: fc.array(fc.float({ min: 0, max: 100 }), { maxLength: 5 }),
        }),
        (person) => {
          return (
            typeof person.name === 'string' &&
            person.name.length > 0 &&
            typeof person.age === 'number' &&
            person.age >= 0 &&
            person.age <= 120 &&
            typeof person.active === 'boolean' &&
            Array.isArray(person.scores) &&
            person.scores.every((score) => score >= 0 && score <= 100)
          );
        },
      ),
      {
        numRuns: 20,
        seed,
        testCaseName: 'complex_object_validation_test',
      },
    );

    // Check that observability data was generated
    expect(fs.existsSync(observerDir)).toBe(true);
    const files = fs.readdirSync(observerDir);
    const jsonlFiles = files.filter((f) => f.endsWith('_test_cases.jsonl'));
    expect(jsonlFiles.length).toBeGreaterThan(0);

    // Read and validate the content
    const content = fs.readFileSync(path.join(observerDir, jsonlFiles[0]), 'utf8');
    const lines = content.trim().split('\n');
    expect(lines.length).toBe(20); // Should have exactly 20 test cases

    // All should be passed for this property
    lines.forEach((line) => {
      const testCase = JSON.parse(line);
      expect(testCase).toMatchObject({
        type: 'test_case',
        run_start: expect.any(Number),
        property: 'complex_object_validation_test',
        status: 'passed',
        status_reason: '',
        representation: expect.any(String),
        features: {},
        coverage: 'no_coverage_info',
        how_generated: 'fast-check',
      });

      // Validate that representation contains object structure
      expect(testCase.representation).toMatch(/\{.*name.*age.*active.*scores.*\}/);
    });
  });

  it('should handle per-test observability configuration', () => {
    // Don't enable globally
    fc.configureGlobal({ observabilityEnabled: false });

    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        return (a + b).length === a.length + b.length;
      }),
      {
        numRuns: 5,
        seed,
        observabilityEnabled: true, // Enable per-test
        testCaseName: 'per_test_observability_test',
      },
    );

    // Check that observability data was generated despite global setting
    expect(fs.existsSync(observerDir)).toBe(true);
    const files = fs.readdirSync(observerDir);
    const jsonlFiles = files.filter((f) => f.endsWith('_test_cases.jsonl'));
    expect(jsonlFiles.length).toBeGreaterThan(0);

    const content = fs.readFileSync(path.join(observerDir, jsonlFiles[0]), 'utf8');
    const lines = content.trim().split('\n');
    expect(lines.length).toBe(5);

    lines.forEach((line) => {
      const testCase = JSON.parse(line);
      expect(testCase.property).toBe('per_test_observability_test');
      expect(testCase.status).toBe('passed');
    });
  });

  it('should not generate observability data when disabled', () => {
    // Ensure observability is disabled
    fc.configureGlobal({ observabilityEnabled: false });

    fc.assert(
      fc.property(fc.integer(), (n) => {
        return typeof n === 'number';
      }),
      {
        numRuns: 10,
        seed,
        testCaseName: 'disabled_observability_test',
      },
    );

    // Check that no observability data was generated
    if (fs.existsSync(observerDir)) {
      const files = fs.readdirSync(observerDir);
      const jsonlFiles = files.filter((f) => f.endsWith('_test_cases.jsonl'));
      expect(jsonlFiles.length).toBe(0);
    }
  });

  it('should handle async properties with observability', async () => {
    fc.configureGlobal({ observabilityEnabled: true });

    await fc.assert(
      fc.asyncProperty(fc.integer(), fc.string(), async (n, s) => {
        // Simulate async operation
        await new Promise((resolve) => setTimeout(resolve, 1));
        return typeof n === 'number' && typeof s === 'string';
      }),
      {
        numRuns: 8,
        seed,
        testCaseName: 'async_property_test',
      },
    );

    // Check that observability data was generated
    expect(fs.existsSync(observerDir)).toBe(true);
    const files = fs.readdirSync(observerDir);
    const jsonlFiles = files.filter((f) => f.endsWith('_test_cases.jsonl'));
    expect(jsonlFiles.length).toBeGreaterThan(0);

    const content = fs.readFileSync(path.join(observerDir, jsonlFiles[0]), 'utf8');
    const lines = content.trim().split('\n');
    expect(lines.length).toBe(8);

    lines.forEach((line) => {
      const testCase = JSON.parse(line);
      expect(testCase).toMatchObject({
        type: 'test_case',
        run_start: expect.any(Number),
        property: 'async_property_test',
        status: 'passed',
        status_reason: '',
        representation: expect.any(String),
        features: {},
        coverage: 'no_coverage_info',
        how_generated: 'fast-check',
      });
    });
  });
});

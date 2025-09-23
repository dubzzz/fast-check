import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import {
  convertExecutionTreesToObservedTestCases,
  convertExecutionTreesToObservedTestCasesWithTestName,
  observe,
} from '../../../../../src/check/runner/reporter/ObservabilityReporter';
import type { RunDetails } from '../../../../../src/check/runner/reporter/RunDetails';
import { ExecutionStatus } from '../../../../../src/check/runner/reporter/ExecutionStatus';
import type { ExecutionTree } from '../../../../../src/check/runner/reporter/ExecutionTree';

vi.mock('fs');
const mockedFs = vi.mocked(fs);

describe('ObservabilityReporter', () => {
  const mockObserverDir = '/test/.fast-check/observer';

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock process.cwd()
    vi.spyOn(process, 'cwd').mockReturnValue('/test');
    // Mock Date constructor for getCurrentDateString
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2022-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('convertExecutionTreesToObservedTestCases', () => {
    it('should convert successful execution tree to observed test case', () => {
      const executionTree: ExecutionTree<number> = {
        status: ExecutionStatus.Success,
        value: 42,
        children: [],
      };

      const runDetails: Partial<RunDetails<number>> = {
        executionSummary: [executionTree],
        failed: false,
        runStart: 1641038400000,
      };

      const result = convertExecutionTreesToObservedTestCases(runDetails as RunDetails<number>, 'test_property');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: 'test_case',
        run_start: 1641038400000,
        property: 'test_property',
        status: 'passed',
        status_reason: '',
        representation: '42',
        features: {},
        coverage: 'no_coverage_info',
        how_generated: 'fast-check',
      });
    });

    it('should convert failed execution tree to observed test case', () => {
      const executionTree: ExecutionTree<string> = {
        status: ExecutionStatus.Failure,
        value: 'test-value',
        children: [],
      };

      const runDetails: Partial<RunDetails<string>> = {
        executionSummary: [executionTree],
        failed: true,
        counterexample: 'test-value',
        runStart: 1641038400000,
      };

      const result = convertExecutionTreesToObservedTestCases(runDetails as RunDetails<string>, 'failing_property');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: 'test_case',
        run_start: 1641038400000,
        property: 'failing_property',
        status: 'failed',
        status_reason: 'Property failed with counterexample',
        representation: '"test-value"',
        features: {},
        coverage: 'no_coverage_info',
        how_generated: 'fast-check',
      });
    });

    it('should convert skipped execution tree to observed test case', () => {
      const executionTree: ExecutionTree<boolean> = {
        status: ExecutionStatus.Skipped,
        value: true,
        children: [],
      };

      const runDetails: Partial<RunDetails<boolean>> = {
        executionSummary: [executionTree],
        failed: false,
        runStart: 1641038400000,
      };

      const result = convertExecutionTreesToObservedTestCases(runDetails as RunDetails<boolean>, 'skipped_property');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        type: 'test_case',
        run_start: 1641038400000,
        property: 'skipped_property',
        status: 'gave_up',
        status_reason: 'Pre-condition failed',
        representation: 'true',
        features: {},
        coverage: 'no_coverage_info',
        how_generated: 'fast-check',
      });
    });

    it('should handle execution trees with children', () => {
      const childTree: ExecutionTree<number> = {
        status: ExecutionStatus.Success,
        value: 10,
        children: [],
      };

      const parentTree: ExecutionTree<number> = {
        status: ExecutionStatus.Failure,
        value: 5,
        children: [childTree],
      };

      const runDetails: Partial<RunDetails<number>> = {
        executionSummary: [parentTree],
        failed: true,
        runStart: 1641038400000,
      };

      const result = convertExecutionTreesToObservedTestCases(runDetails as RunDetails<number>, 'nested_property');

      expect(result).toHaveLength(2);
      expect(result[0].representation).toBe('5');
      expect(result[0].status).toBe('failed');
      expect(result[1].representation).toBe('10');
      expect(result[1].status).toBe('passed');
    });
  });

  describe('convertExecutionTreesToObservedTestCasesWithTestName', () => {
    it('should use testCaseName from runConfiguration when available', () => {
      const executionTree: ExecutionTree<number> = {
        status: ExecutionStatus.Success,
        value: 123,
        children: [],
      };

      const runDetails: Partial<RunDetails<number>> = {
        executionSummary: [executionTree],
        failed: false,
        runStart: 1641038400000,
        runConfiguration: {
          testCaseName: 'explicit_test_name',
        },
      };

      const result = convertExecutionTreesToObservedTestCasesWithTestName(runDetails as RunDetails<number>);

      expect(result).toHaveLength(1);
      expect(result[0].property).toBe('explicit_test_name');
    });
  });

  describe('observe', () => {
    beforeEach(() => {
      // Mock fs methods
      mockedFs.existsSync.mockReturnValue(false);
      mockedFs.mkdirSync.mockImplementation(() => undefined);
      mockedFs.appendFileSync.mockImplementation(() => undefined);
    });

    it('should create observer directory if it does not exist', () => {
      const runDetails: Partial<RunDetails<number>> = {
        executionSummary: [
          {
            status: ExecutionStatus.Success,
            value: 42,
            children: [],
          },
        ],
        failed: false,
        runStart: 1641038400000,
        runConfiguration: {
          testCaseName: 'test_create_directory',
          observabilityEnabled: true,
        },
      };

      mockedFs.existsSync.mockReturnValue(false);

      observe(runDetails as RunDetails<number>);

      expect(mockedFs.mkdirSync).toHaveBeenCalledWith(mockObserverDir, { recursive: true });
    });

    it('should not create directory if it already exists', () => {
      const runDetails: Partial<RunDetails<number>> = {
        executionSummary: [
          {
            status: ExecutionStatus.Success,
            value: 42,
            children: [],
          },
        ],
        failed: false,
        runStart: 1641038400000,
        runConfiguration: {
          testCaseName: 'test_existing_directory',
          observabilityEnabled: true,
        },
      };

      mockedFs.existsSync.mockReturnValue(true);

      observe(runDetails as RunDetails<number>);

      expect(mockedFs.mkdirSync).not.toHaveBeenCalled();
    });

    it('should write test cases to JSONL file', () => {
      const runDetails: Partial<RunDetails<number>> = {
        executionSummary: [
          {
            status: ExecutionStatus.Success,
            value: 42,
            children: [],
          },
        ],
        failed: false,
        runStart: 1641038400000,
        runConfiguration: {
          testCaseName: 'test_write_jsonl',
          observabilityEnabled: true,
        },
      };

      mockedFs.existsSync.mockReturnValue(true);

      observe(runDetails as RunDetails<number>);

      expect(mockedFs.appendFileSync).toHaveBeenCalledWith(
        path.join(mockObserverDir, '2022-01-01_test_cases.jsonl'),
        expect.stringContaining('"property":"test_write_jsonl"'),
        'utf8',
      );
    });

    it('should handle file writing errors gracefully', () => {
      const runDetails: Partial<RunDetails<number>> = {
        executionSummary: [
          {
            status: ExecutionStatus.Success,
            value: 42,
            children: [],
          },
        ],
        failed: false,
        runStart: 1641038400000,
        runConfiguration: {
          testCaseName: 'test_error_handling',
          observabilityEnabled: true,
        },
      };

      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.appendFileSync.mockImplementation(() => {
        throw new Error('File write error');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Should not throw
      expect(() => observe(runDetails as RunDetails<number>)).not.toThrow();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to write test cases to file:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should append to existing file with newline', () => {
      const runDetails: Partial<RunDetails<number>> = {
        executionSummary: [
          {
            status: ExecutionStatus.Success,
            value: 42,
            children: [],
          },
        ],
        failed: false,
        runStart: 1641038400000,
        runConfiguration: {
          testCaseName: 'test_append_existing',
          observabilityEnabled: true,
        },
      };

      // Mock directory exists, and file exists
      mockedFs.existsSync.mockImplementation((filePath) => {
        if (typeof filePath === 'string') {
          if (filePath.includes('observer') && filePath.endsWith('observer')) {
            return true; // Directory exists
          }
          if (filePath.includes('.jsonl')) {
            return true; // File exists
          }
        }
        return false;
      });

      observe(runDetails as RunDetails<number>);

      expect(mockedFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('2022-01-01_test_cases.jsonl'),
        expect.stringMatching(/^\n.*"property":"test_append_existing"/),
        'utf8',
      );
    });

    it('should handle empty execution summary', () => {
      const runDetails: Partial<RunDetails<number>> = {
        executionSummary: [],
        failed: false,
        runStart: 1641038400000,
        runConfiguration: {
          testCaseName: 'test_empty_summary',
          observabilityEnabled: true,
        },
      };

      mockedFs.existsSync.mockReturnValue(true);

      observe(runDetails as RunDetails<number>);

      // Should not call appendFileSync for empty content
      expect(mockedFs.appendFileSync).not.toHaveBeenCalled();
    });

    it('should not write anything when observabilityEnabled is false', () => {
      const runDetails: Partial<RunDetails<number>> = {
        executionSummary: [
          {
            status: ExecutionStatus.Success,
            value: 42,
            children: [],
          },
        ],
        failed: false,
        runStart: 1641038400000,
        runConfiguration: {
          testCaseName: 'test_disabled',
          observabilityEnabled: false,
        },
      };

      mockedFs.existsSync.mockReturnValue(true);

      observe(runDetails as RunDetails<number>);

      // Should not call any fs methods when disabled
      expect(mockedFs.mkdirSync).not.toHaveBeenCalled();
      expect(mockedFs.appendFileSync).not.toHaveBeenCalled();
    });
  });
});

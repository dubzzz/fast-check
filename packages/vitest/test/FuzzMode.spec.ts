import { afterEach, describe, expect, it } from 'vitest';
import { functionNeedsG, readNumRunsOverride } from '../src/internals/FuzzMode.js';

describe('readNumRunsOverride', () => {
  const originalEnv = process.env.FAST_CHECK_VITEST_NUM_RUNS;
  afterEach(() => {
    if (originalEnv === undefined) delete process.env.FAST_CHECK_VITEST_NUM_RUNS;
    else process.env.FAST_CHECK_VITEST_NUM_RUNS = originalEnv;
  });

  it('returns undefined when env var is not set', () => {
    delete process.env.FAST_CHECK_VITEST_NUM_RUNS;
    expect(readNumRunsOverride()).toBeUndefined();
  });

  it('returns parsed integer for valid positive number', () => {
    process.env.FAST_CHECK_VITEST_NUM_RUNS = '50';
    expect(readNumRunsOverride()).toBe(50);
  });

  it('floors fractional values', () => {
    process.env.FAST_CHECK_VITEST_NUM_RUNS = '50.9';
    expect(readNumRunsOverride()).toBe(50);
  });

  it('returns undefined for zero', () => {
    process.env.FAST_CHECK_VITEST_NUM_RUNS = '0';
    expect(readNumRunsOverride()).toBeUndefined();
  });

  it('returns undefined for negative values', () => {
    process.env.FAST_CHECK_VITEST_NUM_RUNS = '-5';
    expect(readNumRunsOverride()).toBeUndefined();
  });

  it('returns undefined for non-numeric strings', () => {
    process.env.FAST_CHECK_VITEST_NUM_RUNS = 'abc';
    expect(readNumRunsOverride()).toBeUndefined();
  });
});

describe('functionNeedsG', () => {
  it('returns false for zero-arg arrow', () => {
    expect(functionNeedsG(() => {})).toBe(false);
  });

  it('returns true for destructured { g }', () => {
    expect(functionNeedsG(({ g }: any) => g)).toBe(true);
  });

  it('returns true for destructured { g: renamed }', () => {
    expect(functionNeedsG(({ g: renamed }: any) => renamed)).toBe(true);
  });

  it('returns false for destructured { expect }', () => {
    expect(functionNeedsG(({ expect }: any) => expect)).toBe(false);
  });

  it('returns false for destructured { foo }', () => {
    expect(functionNeedsG(({ foo }: any) => foo)).toBe(false);
  });

  it('returns true for single-param arrow named g', () => {
    expect(functionNeedsG((g: any) => g)).toBe(true);
  });

  it('returns false for single-param arrow named ctx', () => {
    expect(functionNeedsG((ctx: any) => ctx)).toBe(false);
  });

  it('returns true for async arrow with { g }', () => {
    expect(functionNeedsG(async ({ g }: any) => g)).toBe(true);
  });

  it('returns true for function expression with { g }', () => {
    expect(
      functionNeedsG(function test({ g }: any) {
        return g;
      }),
    ).toBe(true);
  });

  it('returns false for function expression without g', () => {
    expect(
      functionNeedsG(function test({ x }: any) {
        return x;
      }),
    ).toBe(false);
  });

  it('returns true for { g, expect } destructure', () => {
    expect(functionNeedsG(({ g, expect }: any) => [g, expect])).toBe(true);
  });

  it('returns false for names containing g as substring', () => {
    expect(functionNeedsG(({ group }: any) => group)).toBe(false);
  });
});

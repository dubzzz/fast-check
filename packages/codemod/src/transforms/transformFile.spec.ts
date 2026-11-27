import jscodeshift from 'jscodeshift';
import { describe, expect, it, vi } from 'vitest';
import { parseFile } from './transformFile.js';

describe('parseFile', () => {
  it.each([
    ['example.ts', 'const n = <number>value;', true],
    ['example.cts', 'const n = <number>value;', true],
    ['example.mts', 'const n = <number>value;', true],
    ['example.tsx', 'const el: Element = <div />;', true],
    ['example.jsx', 'const el = <div />;', false],
    ['example.mjs', 'export const el = <div />;', false],
  ] as const)('should use the correct parser and output language for %s', (path, source, typescript) => {
    const api = { j: jscodeshift, jscodeshift, stats: vi.fn(), report: vi.fn() };
    const file = parseFile({ path, source }, api);
    expect(file.typescript).toBe(typescript);
    expect(file.print()).toBe(source);
  });

  it('should report original coordinates and preserve the original bytes when an edit is skipped', () => {
    const source = 'const first = 1;\r\n  run(first);\r\n';
    const api = { j: jscodeshift, jscodeshift, stats: vi.fn(), report: vi.fn() };
    const { j, root, print, report } = parseFile({ path: 'test.js', source }, api);
    const call = root.find(j.CallExpression).nodes()[0];
    report(call, 'Review this call.');
    expect(api.report).toHaveBeenCalledWith('warning (2:3): Review this call.');
    expect(print(false)).toBe(source);
  });
});

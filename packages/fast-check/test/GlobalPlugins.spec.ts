import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PluginStore, UniversalPlugin } from '../src/fast-check.js';

describe('Global plugins', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it.each([
    { asyncPredicate: false, noDefaultPlugins: false },
    { asyncPredicate: true, noDefaultPlugins: false },
    { asyncPredicate: false, noDefaultPlugins: true },
    { asyncPredicate: true, noDefaultPlugins: true },
  ])(
    'should order pre, local and post plugins (async: $asyncPredicate, noDefaultPlugins: $noDefaultPlugins)',
    async ({ asyncPredicate, noDefaultPlugins }) => {
      // Arrange
      const fc = await import('../src/fast-check.js');
      const probes: string[] = [];
      const instances: { name: string; index: number; store: PluginStore }[] = [];
      const buildPlugin = (name: string): UniversalPlugin => {
        return (index, store) => {
          instances.push({ name, index, store });
          return {
            decorateGenerate:
              (nestedGenerate) =>
              (...args) => {
                probes.push(`${name}: generate enter`);
                const out = nestedGenerate(...args);
                probes.push(`${name}: generate exit`);
                return out;
              },
            decorateRun: (nestedRun) =>
              asyncPredicate
                ? async (...args) => {
                    probes.push(`${name}: run enter`);
                    const out = await nestedRun(...args);
                    probes.push(`${name}: run exit`);
                    return out;
                  }
                : (...args) => {
                    probes.push(`${name}: run enter`);
                    const out = nestedRun(...args);
                    probes.push(`${name}: run exit`);
                    return out;
                  },
            onAllRunsComplete: () => {
              probes.push(`${name}: complete`);
            },
            afterAll: () => {
              probes.push(`${name}: afterAll`);
            },
          };
        };
      };
      fc.installGlobalPlugin(buildPlugin('post1'), 'post');
      fc.installGlobalPlugin(buildPlugin('pre1'));
      fc.installGlobalPlugin(buildPlugin('post2'), 'post');
      fc.installGlobalPlugin(buildPlugin('pre2'), 'pre');

      // Act
      await fc.assert(
        fc.property(fc.constant(null), () => {
          probes.push('predicate');
          return asyncPredicate ? Promise.resolve(true) : true;
        }),
        { plugins: [buildPlugin('local')], numRuns: 1, noDefaultPlugins },
      );

      // Assert
      expect(instances.map(({ name, index }) => ({ name, index }))).toEqual([
        { name: 'pre1', index: 0 },
        { name: 'pre2', index: 1 },
        { name: 'local', index: 2 },
        { name: 'post1', index: 3 },
        { name: 'post2', index: 4 },
      ]);
      expect(new Set(instances.map(({ store }) => store)).size).toBe(1);
      expect(probes).toEqual([
        'pre1: generate enter',
        'pre2: generate enter',
        'local: generate enter',
        'post1: generate enter',
        'post2: generate enter',
        'post2: generate exit',
        'post1: generate exit',
        'local: generate exit',
        'pre2: generate exit',
        'pre1: generate exit',
        'pre1: run enter',
        'pre2: run enter',
        'local: run enter',
        'post1: run enter',
        'post2: run enter',
        'predicate',
        'post2: run exit',
        'post1: run exit',
        'local: run exit',
        'pre2: run exit',
        'pre1: run exit',
        'pre1: complete',
        'pre2: complete',
        'local: complete',
        'post1: complete',
        'post2: complete',
        'post2: afterAll',
        'post1: afterAll',
        'local: afterAll',
        'pre2: afterAll',
        'pre1: afterAll',
      ]);
    },
  );

  it.each([false, true])(
    'should skip both global positions without uninstalling them (noDefaultPlugins: %s)',
    async (noDefaultPlugins) => {
      // Arrange
      const fc = await import('../src/fast-check.js');
      const pre = vi.fn<UniversalPlugin>(() => ({}));
      const post = vi.fn<UniversalPlugin>(() => ({}));
      const local = vi.fn<UniversalPlugin>(() => ({}));
      fc.installGlobalPlugin(pre);
      fc.installGlobalPlugin(post, 'post');
      const property = fc.property(fc.constant(null), () => false);

      // Act
      const out = fc.assert(property, { plugins: [local], noGlobalPlugins: true, noDefaultPlugins });

      // Assert
      if (noDefaultPlugins) {
        await expect(out).resolves.toBeUndefined();
      } else {
        await expect(out).rejects.toThrow(/Property failed after/);
      }
      expect(pre).not.toHaveBeenCalled();
      expect(post).not.toHaveBeenCalled();
      expect(local).toHaveBeenCalledExactlyOnceWith(0, expect.anything());

      // Skipping globals affects only the selected assertion.
      await fc.assert(property, { plugins: [local], noDefaultPlugins: true });
      expect(pre).toHaveBeenCalledExactlyOnceWith(0, expect.anything());
      expect(local).toHaveBeenNthCalledWith(2, 1, expect.anything());
      expect(post).toHaveBeenCalledExactlyOnceWith(2, expect.anything());
    },
  );

  it.each([false, true])(
    'should run post plugins with no local plugins (noDefaultPlugins: %s)',
    async (noDefaultPlugins) => {
      // Arrange
      const fc = await import('../src/fast-check.js');
      const post = vi.fn<UniversalPlugin>(() => ({}));
      fc.installGlobalPlugin(post, 'post');
      const property = fc.property(fc.constant(null), () => true);

      // Act
      await fc.assert(property, { noDefaultPlugins });
      await fc.assert(property, { plugins: [], noDefaultPlugins });

      // Assert
      expect(post).toHaveBeenCalledTimes(2);
      expect(post).toHaveBeenNthCalledWith(1, 0, expect.anything());
      expect(post).toHaveBeenNthCalledWith(2, 0, expect.anything());
      expect(post.mock.calls[0][1]).not.toBe(post.mock.calls[1][1]);
    },
  );

  it.each([
    { localThrows: false, asyncCompletion: false },
    { localThrows: true, asyncCompletion: false },
    { localThrows: false, asyncCompletion: true },
    { localThrows: true, asyncCompletion: true },
  ])(
    'should prioritize local reports over post reports and post reports over defaults (localThrows: $localThrows, async: $asyncCompletion)',
    async ({ localThrows, asyncCompletion }) => {
      // Arrange
      const fc = await import('../src/fast-check.js');
      const customError = new Error('post report');
      const localError = new Error('local report');
      const report = () => {
        throw customError;
      };
      fc.installGlobalPlugin(() => ({ onAllRunsComplete: asyncCompletion ? async () => report() : report }), 'post');
      const local: UniversalPlugin = () => ({
        onAllRunsComplete: () => {
          if (localThrows) {
            throw localError;
          }
        },
      });

      // Act / Assert
      await expect(
        fc.assert(
          fc.property(fc.constant(null), async () => false),
          { plugins: [local] },
        ),
      ).rejects.toBe(localThrows ? localError : customError);
    },
  );

  it('should preserve default reporting when post plugins do not report an error', async () => {
    // Arrange
    const fc = await import('../src/fast-check.js');
    const onAllRunsComplete = vi.fn();
    fc.installGlobalPlugin(() => ({ onAllRunsComplete }), 'post');

    // Act / Assert
    await expect(fc.assert(fc.property(fc.constant(null), () => false))).rejects.toThrow(/Property failed after/);
    expect(onAllRunsComplete).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ failed: true }));
  });
});

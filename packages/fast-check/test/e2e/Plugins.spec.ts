import { describe, expect, it } from 'vitest';
import * as fc from '../../src/fast-check.js';
import { seed } from './seed.js';

describe(`Plugins (seed: ${seed})`, () => {
  it('should wait and queue afterAll', async () => {
    // Arrange
    const probes: string[] = [];
    const buildPlugin = (pluginName: string): fc.Plugin<[number], true> => {
      return () => {
        probes.push(`${pluginName} instantiated`);
        return {
          afterAll: async () => {
            probes.push(`${pluginName}::afterAll started`);
            await Promise.resolve(`${pluginName}1`);
            await Promise.resolve(`${pluginName}2`);
            await Promise.resolve(`${pluginName}3`);
            probes.push(`${pluginName}::afterAll done`);
          },
        };
      };
    };

    // Act
    probes.push('assert started');
    await fc.assert(
      fc.asyncProperty(fc.integer(), async (_x) => true),
      { plugins: [buildPlugin('a'), buildPlugin('b')] },
    );
    probes.push('assert done');

    // Assert
    expect(probes).toEqual([
      'assert started',
      'a instantiated',
      'b instantiated',
      'a::afterAll started',
      'a::afterAll done',
      'b::afterAll started',
      'b::afterAll done',
      'assert done',
    ]);
  });

  it('should stack decorateRun with the first plugin being the closest to the predicate', () => {
    // Arrange
    const probes: string[] = [];
    const buildPlugin = (pluginName: string): fc.Plugin<[number], false> => {
      return () => {
        probes.push(`${pluginName} instantiated`);
        return {
          decorateRun: (nestedRun) => (value) => {
            probes.push(`${pluginName}::run started`);
            try {
              return nestedRun(value);
            } finally {
              probes.push(`${pluginName}::run done`);
            }
          },
        };
      };
    };

    // Act
    probes.push('assert started');
    fc.assert(
      fc.property(fc.integer(), (_x) => {
        probes.push('predicate called');
        return true;
      }),
      { plugins: [buildPlugin('a'), buildPlugin('b')], numRuns: 2 },
    );
    probes.push('assert done');

    // Assert
    expect(probes).toEqual([
      'assert started',
      'a instantiated',
      'b instantiated',
      'b::run started',
      'a::run started',
      'predicate called',
      'a::run done',
      'b::run done',
      'b::run started',
      'a::run started',
      'predicate called',
      'a::run done',
      'b::run done',
      'assert done',
    ]);
  });

  it('should await decorateRun of asynchronous plugins', async () => {
    // Arrange
    const probes: string[] = [];
    const buildPlugin = (pluginName: string): fc.Plugin<[number], true> => {
      return () => {
        return {
          asyncOnly: true,
          decorateRun: (nestedRun) => async (value) => {
            probes.push(`${pluginName}::run started`);
            await Promise.resolve();
            const out = await nestedRun(value);
            await Promise.resolve();
            probes.push(`${pluginName}::run done`);
            return out;
          },
        };
      };
    };

    // Act
    await fc.assert(
      fc.asyncProperty(fc.integer(), async (_x) => {
        probes.push('predicate called');
        return true;
      }),
      { plugins: [buildPlugin('a'), buildPlugin('b')], numRuns: 2 },
    );

    // Assert
    expect(probes).toEqual([
      'b::run started',
      'a::run started',
      'predicate called',
      'a::run done',
      'b::run done',
      'b::run started',
      'a::run started',
      'predicate called',
      'a::run done',
      'b::run done',
    ]);
  });

  it('should support mixes of sync and async afterAll', async () => {
    // Arrange
    const probes: string[] = [];
    const buildPlugin = (pluginName: string, isAsync: boolean): fc.Plugin<[number], true> => {
      return () => {
        probes.push(`${pluginName} instantiated`);
        return {
          afterAll: isAsync
            ? async () => {
                probes.push(`${pluginName}::afterAll started`);
                await Promise.resolve(`${pluginName}1`);
                await Promise.resolve(`${pluginName}2`);
                await Promise.resolve(`${pluginName}3`);
                probes.push(`${pluginName}::afterAll done`);
              }
            : () => {
                probes.push(`${pluginName}::afterAll started`);
                probes.push(`${pluginName}::afterAll done`);
              },
        };
      };
    };

    // Act
    probes.push('assert started');
    await fc.assert(
      fc.asyncProperty(fc.integer(), async (_x) => true),
      {
        plugins: [
          buildPlugin('a', true),
          buildPlugin('b', true),
          buildPlugin('c', false),
          buildPlugin('d', false),
          buildPlugin('e', true),
        ],
      },
    );
    probes.push('assert done');

    // Assert
    expect(probes).toEqual([
      'assert started',
      'a instantiated',
      'b instantiated',
      'c instantiated',
      'd instantiated',
      'e instantiated',
      'a::afterAll started',
      'a::afterAll done',
      'b::afterAll started',
      'b::afterAll done',
      'c::afterAll started',
      'c::afterAll done',
      'd::afterAll started',
      'd::afterAll done',
      'e::afterAll started',
      'e::afterAll done',
      'assert done',
    ]);
  });
});

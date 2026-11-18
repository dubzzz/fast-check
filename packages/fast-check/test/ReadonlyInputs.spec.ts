import { describe, expect, it } from 'vitest';
import * as fc from '../src/fast-check.js';

describe('readonly inputs', () => {
  it.each([
    ['subarray', fc.subarray],
    ['shuffledSubarray', fc.shuffledSubarray],
  ] as const)('%s should generate and shrink mutable arrays from a frozen source', async (_name, arbitrary) => {
    const source = Object.freeze(['helium', 'neon', 'argon']);
    const arb = arbitrary(source, Object.freeze({ minLength: 1 }));
    const samples = await fc.sample(arb, { seed: 42, numRuns: 20 });
    for (const sample of samples) {
      expect(arb.canShrinkWithoutContext(sample)).toBe(true);
      for (const shrunk of arb.shrink(sample, undefined)) {
        expect(arb.canShrinkWithoutContext(shrunk.value)).toBe(true);
        expect(Object.isFrozen(shrunk.value)).toBe(false);
      }
      sample.push('xenon');
    }
    expect(source).toEqual(['helium', 'neon', 'argon']);
  });

  it('should accept frozen constraints containing frozen arrays', async () => {
    const requiredKeys = Object.freeze(['name'] as const);
    const records = await fc.sample(
      fc.record({ name: fc.constant('helium'), count: fc.nat() }, Object.freeze({ requiredKeys })),
      { seed: 42, numRuns: 20 },
    );
    expect(records.every((record) => record.name === 'helium')).toBe(true);

    const validSchemes = Object.freeze(['https', 'ftp']);
    const urls = await fc.sample(fc.webUrl(Object.freeze({ validSchemes })), { seed: 42, numRuns: 20 });
    expect(urls.every((url) => /^(https|ftp):\/\//.test(url))).toBe(true);

    const version = Object.freeze([4, 7] as const);
    const uuids = await fc.sample(fc.uuid(Object.freeze({ version })), { seed: 42, numRuns: 20 });
    expect(uuids.every((uuid) => uuid[14] === '4' || uuid[14] === '7')).toBe(true);
  });

  it.each([false, true])('should accept frozen object values withBoxedValues=%s', async (withBoxedValues) => {
    const values = Object.freeze([fc.constant('helium'), fc.constant(42)]);
    const constraints = Object.freeze({ values, withBoxedValues, maxDepth: 1 });
    expect(await fc.sample(fc.anything(constraints), { seed: 42, numRuns: 20 })).toHaveLength(20);
    expect(await fc.sample(fc.object(constraints), { seed: 42, numRuns: 20 })).toHaveLength(20);
  });

  it('should accept a frozen list of command arbitraries', async () => {
    const command: fc.Command<{ count: number }, undefined> = {
      check: () => true,
      run: (model) => {
        model.count += 1;
      },
      toString: () => 'increment',
    };
    const commands = Object.freeze([fc.constant(command)]);
    for (const sample of await fc.sample(fc.commands(commands), { seed: 42, numRuns: 20 })) {
      const model = { count: 0 };
      await fc.modelRun(() => ({ model, real: undefined }), sample);
      expect(model.count).toBe(Array.from(sample).length);
    }
  });

  it('should follow a frozen scheduler ordering', async () => {
    const ordering = Object.freeze([2, 1]);
    const scheduler = fc.schedulerFor(ordering, Object.freeze({ act: (f: () => Promise<void>) => f() }));
    const resolved: number[] = [];
    const tasks = [
      scheduler.schedule(Promise.resolve(1)).then((value) => resolved.push(value)),
      scheduler.schedule(Promise.resolve(2)).then((value) => resolved.push(value)),
    ];
    await scheduler.waitIdle();
    await Promise.all(tasks);
    expect(resolved).toEqual([2, 1]);
    expect(ordering).toEqual([2, 1]);
  });

  it('should execute a frozen sequence with function and object builders', async () => {
    const scheduler = fc.schedulerFor(Object.freeze([1, 2]));
    const executed: number[] = [];
    const sequence = Object.freeze([
      async () => {
        executed.push(1);
      },
      Object.freeze({
        builder: async () => {
          executed.push(2);
        },
        label: 'second',
      }),
    ]);
    const status = scheduler.scheduleSequence(sequence);
    await scheduler.waitIdle();
    expect(await status.task).toEqual({ done: true, faulty: false });
    expect(executed).toEqual([1, 2]);
  });

  it('should consume frozen examples, plugins and statistics categories', async () => {
    const examples = Object.freeze<[number][]>([[42], [43]]);
    let beforeEachCalls = 0;
    const plugins = Object.freeze([
      fc.beforeEach(() => {
        ++beforeEachCalls;
      }),
    ]);
    const categories = Object.freeze(['number', 'integer']);
    const received: number[] = [];
    const property = fc.property(fc.nat(), (value) => {
      received.push(value);
    });
    const result = await fc.statistics(property, () => categories, Object.freeze({ examples, plugins, numRuns: 2 }));
    expect(received).toEqual([42, 43]);
    expect(beforeEachCalls).toBe(2);
    expect(result.counts).toEqual(
      new Map([
        ['number', 2],
        ['integer', 2],
      ]),
    );
    expect(result.numValues).toBe(2);
  });
});

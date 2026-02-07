import { WorkerPropertyFromWorker } from '../../../src/internals/worker-property/WorkerPropertyFromWorker.js';
import fc from 'fast-check';
import { xorshift128plus } from 'pure-rand';
import { describe, it, expect, vi } from 'vitest';

describe('WorkerPropertyFromWorker', () => {
  it('should not generate anything from the provided arbitraries eagerly on generate', () => {
    // Arrange
    const mrng = buildMrng();
    const { arbitrary, generate } = buildTrackedArbitrary();
    const arbitraries: [fc.Arbitrary<unknown>] = [arbitrary];
    const predicate = vi.fn<(...inputs: [unknown]) => Promise<void>>().mockResolvedValue();

    // Act
    const property = new WorkerPropertyFromWorker(arbitraries, predicate);
    property.generate(mrng, 0);

    // Assert
    expect(generate).not.toHaveBeenCalled();
    expect(predicate).not.toHaveBeenCalled();
  });

  it('should not generate anything from the provided arbitraries eagerly on generate then run', () => {
    // Arrange
    const mrng = buildMrng();
    const { arbitrary, generate } = buildTrackedArbitrary();
    const arbitraries: [fc.Arbitrary<unknown>] = [arbitrary];
    const predicate = vi.fn<(...inputs: [unknown]) => Promise<void>>().mockResolvedValue();

    // Act
    const property = new WorkerPropertyFromWorker(arbitraries, predicate);
    const value = property.generate(mrng, 0);
    property.runBeforeEach();
    property.run(value.value_);
    property.runAfterEach();

    // Assert
    expect(generate).not.toHaveBeenCalled();
    expect(predicate).toHaveBeenCalledTimes(1);
  });

  it('should only generate from the provided arbitraries when printing the values', () => {
    // Arrange
    const mrng = buildMrng();
    const { arbitrary, generate } = buildTrackedArbitrary();
    generate.mockReturnValue(new fc.Value({ hello: 'world' }, undefined));
    const arbitraries: [fc.Arbitrary<unknown>] = [arbitrary];
    const predicate = vi.fn<(...inputs: [unknown]) => Promise<void>>().mockResolvedValue();

    // Act
    const property = new WorkerPropertyFromWorker(arbitraries, predicate);
    const value = property.generate(mrng, 0);
    const stringified = fc.stringify(value.value_);

    // Assert
    expect(generate).toHaveBeenCalledTimes(1);
    expect(stringified).toBe('[{"hello":"world"}]');
  });

  it('should support delayed and out-of-order calls to print the values', () => {
    // Arrange
    const orderedValues = [
      new fc.Value({ hello: 'world' }, undefined),
      new fc.Value({ how: 'are you?' }, undefined),
      new fc.Value({ tell: 'me' }, undefined),
    ];
    const mrngStates: (readonly number[] | undefined)[] = [];
    const mrng = buildMrng();
    const { arbitrary, generate } = buildTrackedArbitrary();
    generate.mockImplementation((mrng) => {
      const index = mrngStates.findIndex((s) => JSON.stringify(s) === JSON.stringify(mrng.getState()));
      return orderedValues[index];
    });
    const arbitraries: [fc.Arbitrary<unknown>] = [arbitrary];
    const predicate = vi.fn<(...inputs: [unknown]) => Promise<void>>().mockResolvedValue();

    // Act
    const property = new WorkerPropertyFromWorker(arbitraries, predicate);

    mrngStates.push(mrng.getState());
    const value1 = property.generate(mrng, 0);
    mrng.nextInt();

    mrngStates.push(mrng.getState());
    const value2 = property.generate(mrng, 0);
    mrng.nextInt();

    mrngStates.push(mrng.getState());
    const value3 = property.generate(mrng, 0);
    mrng.nextInt();

    const stringified2 = fc.stringify(value2.value_);
    const stringified3 = fc.stringify(value3.value_);
    const stringified1 = fc.stringify(value1.value_);

    // Assert
    expect(generate).toHaveBeenCalledTimes(3);
    expect(stringified1).toBe('[{"hello":"world"}]');
    expect(stringified2).toBe('[{"how":"are you?"}]');
    expect(stringified3).toBe('[{"tell":"me"}]');
  });
});

// Helpers

class TrackedArbitrary extends fc.Arbitrary<unknown> {
  constructor(private readonly generateFn: fc.Arbitrary<unknown>['generate']) {
    super();
  }
  generate(mrng: fc.Random, biasFactor: number | undefined): fc.Value<unknown> {
    return this.generateFn(mrng, biasFactor);
  }
  canShrinkWithoutContext(_value: unknown): _value is unknown {
    throw new Error('Method not implemented.');
  }
  shrink(_value: unknown, _context: unknown): fc.Stream<fc.Value<unknown>> {
    throw new Error('Method not implemented.');
  }
}

function buildTrackedArbitrary() {
  const generate = vi.fn<fc.Arbitrary<unknown>['generate']>();
  return { arbitrary: new TrackedArbitrary(generate), generate };
}

function buildMrng() {
  return new fc.Random(xorshift128plus(0));
}

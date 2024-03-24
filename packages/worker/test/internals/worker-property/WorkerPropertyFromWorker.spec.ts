import { jest } from '@jest/globals';
import { WorkerPropertyFromWorker } from '../../../src/internals/worker-property/WorkerPropertyFromWorker.js';
import fc from 'fast-check';
import { xorshift128plus } from 'pure-rand';

describe('WorkerPropertyFromWorker', () => {
  it('should not generate anything from the provided arbitraries eagerly on generate', () => {
    // Arrange
    const mrng = buildMrng();
    const { arbitrary, generate } = buildTrackedArbitrary();
    const arbitraries: [fc.Arbitrary<unknown>] = [arbitrary];
    const predicate = jest.fn<(...inputs: [unknown]) => Promise<void>>().mockResolvedValue();

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
    const predicate = jest.fn<(...inputs: [unknown]) => Promise<void>>().mockResolvedValue();

    // Act
    const property = new WorkerPropertyFromWorker(arbitraries, predicate);
    const value = property.generate(mrng, 0);
    property.runBeforeEach();
    property.run(value.value_, true);
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
    const predicate = jest.fn<(...inputs: [unknown]) => Promise<void>>().mockResolvedValue();

    // Act
    const property = new WorkerPropertyFromWorker(arbitraries, predicate);
    const value = property.generate(mrng, 0);
    const stringified = fc.stringify(value.value_);

    // Assert
    expect(generate).toHaveBeenCalledTimes(1);
    expect(stringified).toBe('[{"hello":"world"}]');
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
  const generate = jest.fn<fc.Arbitrary<unknown>['generate']>();
  return { arbitrary: new TrackedArbitrary(generate), generate };
}

function buildMrng() {
  return new fc.Random(xorshift128plus(0));
}

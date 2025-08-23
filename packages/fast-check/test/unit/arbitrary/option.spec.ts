import { describe, it, expect, vi } from 'vitest';
import * as fc from 'fast-check';
import type { OptionConstraints } from '../../../src/arbitrary/option';
import { option } from '../../../src/arbitrary/option';
import { FakeIntegerArbitrary, fakeArbitrary } from './__test-helpers__/ArbitraryHelpers';
import * as FrequencyArbitraryMock from '../../../src/arbitrary/_internals/FrequencyArbitrary';
import * as ConstantMock from '../../../src/arbitrary/constant';
import { constant } from '../../../src/arbitrary/constant';
import {
  assertProduceValuesShrinkableWithoutContext,
  assertProduceCorrectValues,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertProduceSameValueGivenSameSeed,
} from './__test-helpers__/ArbitraryAssertions';
import { sizeArb } from './__test-helpers__/SizeHelpers';
import { declareCleaningHooksForSpies } from './__test-helpers__/SpyCleaner';

describe('option', () => {
  declareCleaningHooksForSpies();

  it('should call FrequencyArbitrary.from with the right parameters when called with constraints', () =>
    fc.assert(
      fc.property(
        fc.record(
          {
            depthIdentifier: fc.string(),
            depthSize: fc.oneof(fc.double({ min: 0, noNaN: true }), sizeArb),
            maxDepth: fc.nat(),
            freq: fc.nat(),
            nil: fc.anything(),
          },
          { requiredKeys: [] },
        ),
        (constraints: Partial<OptionConstraints<unknown>>) => {
          // Arrange
          const expectedNil = 'nil' in constraints ? constraints.nil : null;
          const expectedArb = fakeArbitrary().instance;
          const from = vi.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'from');
          from.mockReturnValue(expectedArb);
          const expectedConstantArb = fakeArbitrary().instance;
          const constant = vi.spyOn(ConstantMock, 'constant');
          constant.mockReturnValue(expectedConstantArb);
          const { instance: arb } = fakeArbitrary();

          // Act
          const out = option(arb, constraints);

          // Assert
          expect(constant).toHaveBeenCalledWith(expectedNil);
          expect(from).toHaveBeenCalledWith(
            [
              { arbitrary: expectedConstantArb, weight: 1, fallbackValue: { default: expectedNil } },
              { arbitrary: arb, weight: 'freq' in constraints ? constraints.freq! : 5 },
            ],
            {
              withCrossShrink: true,
              depthSize: constraints.depthSize,
              maxDepth: constraints.maxDepth,
              depthIdentifier: constraints.depthIdentifier,
            },
            'fc.option',
          );
          expect(out).toBe(expectedArb);
        },
      ),
    ));

  it('should call FrequencyArbitrary.from with the right parameters when called without constraints', () => {
    // Arrange
    const expectedArb = fakeArbitrary().instance;
    const from = vi.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'from');
    from.mockReturnValue(expectedArb);
    const expectedConstantArb = fakeArbitrary().instance;
    const constant = vi.spyOn(ConstantMock, 'constant');
    constant.mockReturnValue(expectedConstantArb);
    const { instance: arb } = fakeArbitrary();

    // Act
    const out = option(arb);

    // Assert
    expect(constant).toHaveBeenCalledWith(null);
    expect(from).toHaveBeenCalledWith(
      [
        { arbitrary: expectedConstantArb, weight: 1, fallbackValue: { default: null } },
        { arbitrary: arb, weight: 5 },
      ],
      {
        withCrossShrink: true,
        depthSize: undefined,
        maxDepth: undefined,
        depthIdentifier: undefined,
      },
      'fc.option',
    );
    expect(out).toBe(expectedArb);
  });
});

describe('option (integration)', () => {
  type Extra = { freq?: number };
  const extraParameters = fc.record({ freq: fc.nat() }, { requiredKeys: [] });

  const isCorrect = (value: number | null, extra: Extra) =>
    value === null || ((extra.freq === undefined || extra.freq > 0) && typeof value === 'number');

  const optionBuilder = (extra: Extra) => option(new FakeIntegerArbitrary(), { ...extra, nil: null });

  it('should produce the same values given the same seed', () => {
    assertProduceSameValueGivenSameSeed(optionBuilder, { extraParameters });
  });

  it('should only produce correct values', () => {
    assertProduceCorrectValues(optionBuilder, isCorrect, { extraParameters });
  });

  it('should produce values seen as shrinkable without any context (if underlyings do)', () => {
    assertProduceValuesShrinkableWithoutContext(optionBuilder, { extraParameters });
  });

  it('should be able to shrink to the same values without initial context (if underlyings do)', () => {
    assertShrinkProducesSameValueWithoutInitialContext(optionBuilder, { extraParameters });
  });

  it('should always return nil when freq = 1', () => {
    fc.assert(
      fc.property(option(constant(true), { freq: 1 }), (o) => {
        expect(o).toBe(null);
      }),
    );
  });
});

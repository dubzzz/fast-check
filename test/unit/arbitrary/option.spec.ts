import * as fc from '../../../lib/fast-check';
import { option, OptionConstraints } from '../../../src/arbitrary/option';
import { FakeIntegerArbitrary, fakeNextArbitrary } from '../check/arbitrary/generic/NextArbitraryHelpers';
import { convertFromNext, convertToNext } from '../../../src/check/arbitrary/definition/Converters';
import * as FrequencyArbitraryMock from '../../../src/arbitrary/_internals/FrequencyArbitrary';
import * as ConstantMock from '../../../src/arbitrary/constant';
import {
  assertGenerateProducesCorrectValues,
  assertGenerateProducesSameValueGivenSameSeed,
  assertGenerateProducesValuesFlaggedAsCanGenerate,
  assertShrinkProducesCorrectValues,
  assertShrinkProducesSameValueWithoutInitialContext,
  assertShrinkProducesValuesFlaggedAsCanGenerate,
} from '../check/arbitrary/generic/NextArbitraryAssertions';

function beforeEachHook() {
  jest.resetModules();
  jest.restoreAllMocks();
  fc.configureGlobal({ beforeEach: beforeEachHook });
}
beforeEach(beforeEachHook);

describe('option', () => {
  it('should call FrequencyArbitrary.from with the right parameters when called with constraints', () =>
    fc.assert(
      fc.property(
        fc.record(
          {
            depthIdentifier: fc.string(),
            depthFactor: fc.double({ min: 0.01, noDefaultInfinity: true, noNaN: true }),
            maxDepth: fc.nat(),
            freq: fc.nat(),
            nil: fc.anything(),
          },
          { requiredKeys: [] }
        ),
        (constraints: Partial<OptionConstraints<unknown>>) => {
          // Arrange
          const expectedNil = 'nil' in constraints ? constraints.nil : null;
          const expectedArb = convertFromNext(fakeNextArbitrary().instance);
          const fromOld = jest.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'fromOld');
          fromOld.mockReturnValue(expectedArb);
          const expectedConstantArb = convertFromNext(fakeNextArbitrary().instance);
          const constant = jest.spyOn(ConstantMock, 'constant');
          constant.mockReturnValue(expectedConstantArb);
          const { instance: nextArb } = fakeNextArbitrary();
          const arb = convertFromNext(nextArb);

          // Act
          const out = option(arb, constraints);

          // Assert
          expect(constant).toHaveBeenCalledWith(expectedNil);
          expect(fromOld).toHaveBeenCalledWith(
            [
              { arbitrary: expectedConstantArb, weight: 1, fallbackValue: { default: expectedNil } },
              { arbitrary: arb, weight: 'freq' in constraints ? constraints.freq! : 5 },
            ],
            {
              withCrossShrink: true,
              depthFactor: constraints.depthFactor,
              maxDepth: constraints.maxDepth,
              depthIdentifier: constraints.depthIdentifier,
            },
            'fc.option'
          );
          expect(out).toBe(expectedArb);
        }
      )
    ));

  it('should call FrequencyArbitrary.from with the right parameters when called without constraints', () => {
    // Arrange
    const expectedArb = convertFromNext(fakeNextArbitrary().instance);
    const fromOld = jest.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'fromOld');
    fromOld.mockReturnValue(expectedArb);
    const expectedConstantArb = convertFromNext(fakeNextArbitrary().instance);
    const constant = jest.spyOn(ConstantMock, 'constant');
    constant.mockReturnValue(expectedConstantArb);
    const { instance: nextArb } = fakeNextArbitrary();
    const arb = convertFromNext(nextArb);

    // Act
    const out = option(arb);

    // Assert
    expect(constant).toHaveBeenCalledWith(null);
    expect(fromOld).toHaveBeenCalledWith(
      [
        { arbitrary: expectedConstantArb, weight: 1, fallbackValue: { default: null } },
        { arbitrary: arb, weight: 5 },
      ],
      {
        withCrossShrink: true,
        depthFactor: undefined,
        maxDepth: undefined,
        depthIdentifier: undefined,
      },
      'fc.option'
    );
    expect(out).toBe(expectedArb);
  });
  it('[legacy] should call FrequencyArbitrary.from with the right parameters when called with only freq', () =>
    fc.assert(
      fc.property(fc.nat(), (freq) => {
        // Arrange
        const expectedArb = convertFromNext(fakeNextArbitrary().instance);
        const fromOld = jest.spyOn(FrequencyArbitraryMock.FrequencyArbitrary, 'fromOld');
        fromOld.mockReturnValue(expectedArb);
        const expectedConstantArb = convertFromNext(fakeNextArbitrary().instance);
        const constant = jest.spyOn(ConstantMock, 'constant');
        constant.mockReturnValue(expectedConstantArb);
        const { instance: nextArb } = fakeNextArbitrary();
        const arb = convertFromNext(nextArb);

        // Act
        const out = option(arb, freq);

        // Assert
        expect(constant).toHaveBeenCalledWith(null);
        expect(fromOld).toHaveBeenCalledWith(
          [
            { arbitrary: expectedConstantArb, weight: 1, fallbackValue: { default: null } },
            { arbitrary: arb, weight: freq },
          ],
          {
            withCrossShrink: true,
            depthFactor: undefined,
            maxDepth: undefined,
            depthIdentifier: undefined,
          },
          'fc.option'
        );
        expect(out).toBe(expectedArb);
      })
    ));
});

describe('option (integration)', () => {
  type Extra = { freq?: number };
  const extraParameters = fc.record({ freq: fc.nat() }, { requiredKeys: [] });

  const isCorrect = (value: number | null, extra: Extra) =>
    value === null || ((extra.freq === undefined || extra.freq > 0) && typeof value === 'number');

  const optionBuilder = (extra: Extra) =>
    convertToNext(option(convertFromNext(new FakeIntegerArbitrary()), { ...extra, nil: null }));

  it('should generate the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(optionBuilder, { extraParameters });
  });

  it('should only generate correct values', () => {
    assertGenerateProducesCorrectValues(optionBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during generate', () => {
    assertGenerateProducesValuesFlaggedAsCanGenerate(optionBuilder, { extraParameters });
  });

  it('should shrink towards the same values given the same seed', () => {
    assertGenerateProducesSameValueGivenSameSeed(optionBuilder, { extraParameters });
  });

  it('should be able to shrink without any context', () => {
    assertShrinkProducesSameValueWithoutInitialContext(optionBuilder, { extraParameters });
  });

  it('should only shrink towards correct values', () => {
    assertShrinkProducesCorrectValues(optionBuilder, isCorrect, { extraParameters });
  });

  it('should recognize values that would have been generated using it during shrink', () => {
    assertShrinkProducesValuesFlaggedAsCanGenerate(optionBuilder, { extraParameters });
  });
});
